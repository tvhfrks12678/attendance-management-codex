# Effect.ts 導入メモ（Attendance Service）

## Before: 変更前のコード片と、その問題点

> 変更前は `Promise` と `await` を直接つなぎ、同期処理・非同期処理・業務ルール検証が混ざりやすい構成でした（下記はイメージ）。

```ts
async function mutateAttendance(input: MutateInput) {
  const at = input.clock.now().toISOString();
  const dayKey = input.clock.todayKey();

  const events = await input.repo.listEventsForDay(input.userId, dayKey);

  if (events.some((event) => event.requestId === input.requestId)) {
    return { ok: true as const, inserted: false };
  }

  validateEventTransition(input.type, events);

  const inserted = await input.repo.appendEventIfNew({
    userId: input.userId,
    dayKey,
    type: input.type,
    at,
    requestId: input.requestId,
  });

  return { ok: true as const, inserted };
}
```

### 問題点

- **処理の意図が一列に見えづらい**  
  同期処理（時刻計算、検証）と非同期処理（DB I/O）が同じレイヤーに並ぶため、「どこが副作用か」が読み取りづらい。
- **合成しにくい**  
  「事前準備 → 取得 → 検証 → 書き込み」という流れを再利用したいとき、`async` 関数を都度組み替える必要がある。
- **失敗の境界が曖昧になりやすい**  
  `throw` と `await` 例外が混在し、どの段階で何が失敗しうるかをコードから追いにくい。

---

## After: Effect.ts を使った後のコード片

> `src/lib/effect.ts` の最小 Effect 実装を使って、処理を「値として組み立てて最後に実行する」形に変更。

```ts
function mutateAttendance(input: MutateInput) {
  const prepareEffect = Effect.sync(() => ({
    at: input.clock.now().toISOString(),
    dayKey: input.clock.todayKey(),
  }));

  const mutationEffect = Effect.flatMap(prepareEffect, ({ at, dayKey }) => {
    const listEventsEffect = Effect.tryPromise(() =>
      input.repo.listEventsForDay(input.userId, dayKey),
    );

    return Effect.flatMap(listEventsEffect, (events) => {
      if (events.some((event) => event.requestId === input.requestId)) {
        return Effect.succeed({ ok: true as const, inserted: false });
      }

      const validateEffect = Effect.sync(() =>
        validateEventTransition(input.type, events),
      );

      const appendEffect = Effect.flatMap(validateEffect, () =>
        Effect.tryPromise(() =>
          input.repo.appendEventIfNew({
            userId: input.userId,
            dayKey,
            type: input.type,
            at,
            requestId: input.requestId,
          }),
        ),
      );

      return Effect.map(appendEffect, (inserted) => ({
        ok: true as const,
        inserted,
      }));
    });
  });

  return Effect.runPromise(mutationEffect);
}
```

---

## Why: なぜこの変更をしたのか

- **型安全性を保ったまま処理を段階化するため**  
  `sync / tryPromise / map / flatMap` で「このステップは何を受け取り、何を返すか」が明示され、関数合成の境界が明確になる。
- **エラー発生ポイントを意識しやすくするため**  
  どこが同期評価で、どこが I/O かを Effect コンストラクタで表現できる。レビュー時に失敗経路を追いやすい。
- **合成しやすさ（再利用性）を上げるため**  
  `Effect<A>` を値として保持して `flatMap`/`map` でつなぐため、処理分割・差し替え・テストがしやすい。
- **副作用の実行タイミングを一点に寄せるため**  
  最後に `runPromise` で実行するため、「構築」と「実行」を分離できる。

---

## 関数型プログラミングの概念（このコードで使っているもの）

この変更は「関数型っぽく見せる」ことが目的ではなく、**副作用の制御と合成のしやすさ**を上げるために関数型の道具を使っています。

- **参照透過に近づける（副作用を遅延させる）**  
  `Effect.sync` / `Effect.tryPromise` で、すぐ実行せず「実行可能な値（Effect）」として持つことで、処理の組み立てと実行を分離している。
- **モナド的な逐次合成（flatMap）**  
  `flatMap` は「前段の結果を受けて次の Effect を作る」ため、依存する処理を安全につなげる。
- **純粋変換（map）**  
  `map` は副作用の結果を別の値に変換するだけ。I/O は増やさずに出力形を整える。
- **代数的データ型に近い扱い（`ok: true as const`）**  
  リテラルを固定して戻り値の形を狭め、呼び出し側で扱いやすくしている。
- **関心の分離**  
  「取得」「検証」「書き込み」「結果整形」を Effect 単位に分けることで、責務が分かれ、変更の影響範囲が小さくなる。

---

## コードの一行ごとの説明（After 抜粋）

対象コード:

```ts
function mutateAttendance(input: MutateInput) {
  const prepareEffect = Effect.sync(() => ({
    at: input.clock.now().toISOString(),
    dayKey: input.clock.todayKey(),
  }));

  const mutationEffect = Effect.flatMap(prepareEffect, ({ at, dayKey }) => {
    const listEventsEffect = Effect.tryPromise(() =>
      input.repo.listEventsForDay(input.userId, dayKey),
    );

    return Effect.flatMap(listEventsEffect, (events) => {
      if (events.some((event) => event.requestId === input.requestId)) {
        return Effect.succeed({ ok: true as const, inserted: false });
      }

      const validateEffect = Effect.sync(() =>
        validateEventTransition(input.type, events),
      );

      const appendEffect = Effect.flatMap(validateEffect, () =>
        Effect.tryPromise(() =>
          input.repo.appendEventIfNew({
            userId: input.userId,
            dayKey,
            type: input.type,
            at,
            requestId: input.requestId,
          }),
        ),
      );

      return Effect.map(appendEffect, (inserted) => ({
        ok: true as const,
        inserted,
      }));
    });
  });

  return Effect.runPromise(mutationEffect);
}
```

### 行ごとの意味

1. `function mutateAttendance(input: MutateInput) {`  
   出退勤イベント更新のユースケース関数。依存（repo/clock/userId など）が入った `input` を受け取る。
2. `const prepareEffect = Effect.sync(() => ({`  
   同期処理を Effect 化。まだ実行しない「準備ステップ」を作る。
3. `at: input.clock.now().toISOString(),`  
   現在時刻を ISO 文字列化してイベント時刻に使う。
4. `dayKey: input.clock.todayKey(),`  
   当日キー（例: YYYY-MM-DD）を取得。
5. `}));`  
   準備 Effect の定義を閉じる。
6. `const mutationEffect = Effect.flatMap(prepareEffect, ({ at, dayKey }) => {`  
   準備結果（`at`, `dayKey`）を受けて次の Effect を組み立てる。逐次合成の開始。
7. `const listEventsEffect = Effect.tryPromise(() =>`  
   非同期 I/O（DB 取得）を Effect 化。
8. `input.repo.listEventsForDay(input.userId, dayKey),`  
   その日の既存イベント一覧を読み込む。
9. `);`  
   取得 Effect の定義を閉じる。
10. `return Effect.flatMap(listEventsEffect, (events) => {`  
    取得した `events` を使って次の処理へ。
11. `if (events.some((event) => event.requestId === input.requestId)) {`  
    同一 requestId があれば重複リクエストと判定。
12. `return Effect.succeed({ ok: true as const, inserted: false });`  
    早期終了。DB 追加せず成功レスポンスを返す Effect を返す。
13. `}`  
    重複判定分岐を終了。
14. `const validateEffect = Effect.sync(() =>`  
    ドメインルール検証を同期 Effect として表現。
15. `validateEventTransition(input.type, events),`  
    現在のイベント列に対して遷移可能か検証（不正なら例外）。
16. `);`  
    検証 Effect を閉じる。
17. `const appendEffect = Effect.flatMap(validateEffect, () =>`  
    検証成功時のみ append へ進む。
18. `Effect.tryPromise(() =>`  
    追加処理（非同期）を Effect 化。
19. `input.repo.appendEventIfNew({`  
    新規イベントを idempotent に追加するリポジトリ API 呼び出し。
20. `userId: input.userId,`  
    書き込み対象ユーザー。
21. `dayKey,`  
    書き込み対象日。
22. `type: input.type,`  
    イベント種別（CLOCK_IN など）。
23. `at,`  
    記録時刻。
24. `requestId: input.requestId,`  
    冪等性制御用 ID。
25. `}),`  
    append API 引数オブジェクトを閉じる。
26. `),`  
    `tryPromise` を閉じる。
27. `);`  
    `appendEffect` の定義を閉じる。
28. `return Effect.map(appendEffect, (inserted) => ({`  
    append の結果 `inserted` をレスポンス形へ変換。
29. `ok: true as const,`  
    成功フラグをリテラル固定。
30. `inserted,`  
    実際に挿入したかどうかを返す。
31. `}));`  
    map による整形処理を閉じる。
32. `});`  
    `listEventsEffect` からの flatMap を閉じる。
33. `});`  
    `prepareEffect` からの flatMap を閉じる。
34. `return Effect.runPromise(mutationEffect);`  
    ここで初めて実行。組み立て済み Effect を Promise として動かす。
35. `}`  
    関数終了。

---

## 概念メモ（Effect.ts 関連）

- **Effect**  
  「副作用を含む計算」を値として表すもの。ここでは `type Effect<A> = () => Promise<A>` という最小表現。
- **pipe**  
  左から右へ値を渡して処理を読みやすくする記法。今回の実装は `flatMap/map` 直結だが、`pipe` があると宣言的に書きやすい。
- **Layer**  
  依存関係（DB、Clock、Logger など）を組み立てるための抽象。アプリ規模が大きくなるほど「依存注入の構造化」に効く。
- **Schema**  
  入出力データの形とバリデーションを型と一体で定義する考え方。実行時チェックと型推論のズレを減らせる。

> 今回のコードは「最小 Effect 実装」だが、考え方としては本格的な Effect エコシステム（依存注入・エラー型・Schema 連携）にスケールしやすい土台になっている。

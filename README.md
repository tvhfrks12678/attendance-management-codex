# 出勤管理サイト

出勤・退勤の打刻と、その日の勤怠サマリーを確認するための Web アプリです。

## 技術スタック
- 言語: TypeScript
- フレームワーク: TanStack Start（React）
- 関数型プログラミング: Effect.ts
- テスト: Vitest / React Testing Library / Playwright
- インフラ: Cloudflare

## ディレクトリ構造

```text
.
├── public/                         # 静的アセット（favicon, manifest など）
├── src/
│   ├── components/                 # アプリ全体で使う共通 UI コンポーネント
│   ├── features/
│   │   └── attendance/             # 勤怠機能（機能単位で責務を分割）
│   │       ├── application/        # ユースケース層（ドメインを使って処理を組み立てる）
│   │       │   ├── server-fns/     # クライアントから呼び出すサーバー関数
│   │       │   └── services/       # アプリケーションサービス（打刻などの処理本体）
│   │       ├── domain/             # 業務ルールの中心（フレームワーク非依存）
│   │       │   ├── entities/       # エンティティ（AttendanceEvent / AttendanceDay など）
│   │       │   ├── logic/          # ドメインロジック（集計・判定ルール）
│   │       │   └── ports/          # 外部依存の抽象（Repository / Clock のインターフェース）
│   │       ├── infrastructure/     # 外部依存の実装（DB・システム時計など）
│   │       │   ├── clock/          # Clock ポートの実装
│   │       │   └── db/             # Repository ポートの実装
│   │       └── presentation/       # 画面表示や操作に関する層
│   │           ├── hooks/          # UI から使うカスタムフック
│   │           └── parts/          # 勤怠画面の部品コンポーネント
│   ├── lib/                        # 汎用ユーティリティ（Effect 設定・共通関数）
│   ├── routes/                     # TanStack Router のルート定義
│   ├── router.tsx                  # ルーター初期化
│   ├── routeTree.gen.ts            # ルート定義の自動生成ファイル
│   └── styles.css                  # 全体スタイル
├── tests/
│   └── e2e/                        # Playwright による E2E テスト
├── biome.json                      # Lint/Format 設定
├── playwright.config.ts            # E2E テスト設定
├── vite.config.ts                  # Vite / TanStack Start 設定
└── wrangler.jsonc                  # Cloudflare デプロイ設定
```

## 各層の役割（attendance 機能）

### domain
- **何を置くか**: 業務ルールそのもの（例: 出勤/退勤イベントの整合性、当日サマリー算出）。
- **目的**: フレームワークや DB の都合から独立させ、仕様変更に強くする。
- **ポイント**: `ports` で外部依存を抽象化し、純粋なロジックを保つ。

### application
- **何を置くか**: ユースケース単位の処理（「打刻する」「今日の状態を取得する」など）。
- **目的**: domain のルールを使って、実行フローを組み立てる。
- **ポイント**: 直接インフラ詳細に依存せず、`domain/ports` 経由で利用する。

### infrastructure
- **何を置くか**: DB・時刻取得など、外部システムに触る実装。
- **目的**: domain/application から技術詳細を隔離する。
- **ポイント**: `domain/ports` の実装をここで提供し、差し替え可能にする。

### presentation
- **何を置くか**: 画面コンポーネント、フック、表示用の組み立て。
- **目的**: UI の関心事（表示・操作）を他層から分離する。
- **ポイント**: 可能な限り application を呼び出すだけにして、業務ルールは domain に寄せる。

## 開発コマンド

```bash
pnpm install
pnpm dev
pnpm build
pnpm test
pnpm lint
pnpm format
pnpm check
```

export type Effect<A> = () => Promise<A>;

const sync =
	<A>(thunk: () => A): Effect<A> =>
	async () =>
		thunk();

const tryPromise =
	<A>(thunk: () => Promise<A>): Effect<A> =>
	async () =>
		thunk();

const succeed =
	<A>(value: A): Effect<A> =>
	async () =>
		value;

const map = <A, B>(effect: Effect<A>, f: (value: A) => B): Effect<B> => {
	return async () => f(await effect());
};

const flatMap = <A, B>(
	effect: Effect<A>,
	f: (value: A) => Effect<B>,
): Effect<B> => {
	return async () => f(await effect())();
};

const runPromise = <A>(effect: Effect<A>): Promise<A> => effect();

export const Effect = {
	sync,
	tryPromise,
	succeed,
	map,
	flatMap,
	runPromise,
};

export type Clock = {
	now: () => Date;
	todayKey: () => string;
};

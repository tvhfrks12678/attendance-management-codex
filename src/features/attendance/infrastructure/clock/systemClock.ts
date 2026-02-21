import type { Clock } from "../../domain/ports/clock";

const TOKYO_TZ = "Asia/Tokyo";

function toTokyoDayKey(date: Date) {
	const formatter = new Intl.DateTimeFormat("sv-SE", {
		timeZone: TOKYO_TZ,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});
	return formatter.format(date);
}

export const systemClock: Clock = {
	now: () => new Date(),
	todayKey: () => toTokyoDayKey(new Date()),
};

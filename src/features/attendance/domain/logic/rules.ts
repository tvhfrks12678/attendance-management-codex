import type { AttendanceEvent } from "../entities/attendanceEvent";

function assertLastEvent(events: AttendanceEvent[]) {
	return events[events.length - 1];
}

function isOnBreak(events: AttendanceEvent[]) {
	let onBreak = false;
	for (const event of events) {
		if (event.type === "BREAK_START") onBreak = true;
		if (event.type === "BREAK_END") onBreak = false;
	}
	return onBreak;
}

export function ensureCanClockIn(events: AttendanceEvent[]) {
	const last = assertLastEvent(events);
	if (last && last.type !== "CLOCK_OUT") {
		throw new Error("すでに出勤中です。");
	}
}

export function ensureCanClockOut(events: AttendanceEvent[]) {
	const last = assertLastEvent(events);
	if (!last) throw new Error("出勤前は退勤できません。");
	if (last.type === "CLOCK_OUT") throw new Error("すでに退勤済みです。");
	if (isOnBreak(events)) throw new Error("休憩中は先に休憩終了してください。");
}

export function ensureCanBreakStart(events: AttendanceEvent[]) {
	const last = assertLastEvent(events);
	if (!last || last.type === "CLOCK_OUT") {
		throw new Error("出勤中のみ休憩開始できます。");
	}
	if (isOnBreak(events)) {
		throw new Error("すでに休憩中です。");
	}
}

export function ensureCanBreakEnd(events: AttendanceEvent[]) {
	if (!isOnBreak(events)) {
		throw new Error("休憩開始後のみ休憩終了できます。");
	}
}

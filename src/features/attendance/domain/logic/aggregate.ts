import type { AttendanceDaySummary } from "../entities/attendanceDay";
import type { AttendanceEvent } from "../entities/attendanceEvent";

function diffMinutes(start: Date, end: Date) {
	return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 60000));
}

export function aggregateDay(
	dayKey: string,
	events: AttendanceEvent[],
): AttendanceDaySummary {
	const sorted = [...events].sort((a, b) => a.at.localeCompare(b.at));
	let workStart: Date | null = null;
	let breakStart: Date | null = null;
	let totalWorkMinutes = 0;
	let totalBreakMinutes = 0;
	const issues: string[] = [];

	for (const event of sorted) {
		const at = new Date(event.at);

		if (event.type === "CLOCK_IN") {
			if (workStart) {
				issues.push("連続した出勤打刻があります。");
			}
			workStart = at;
			continue;
		}

		if (event.type === "BREAK_START") {
			if (!workStart) {
				issues.push("出勤前の休憩開始があります。");
			}
			if (breakStart) {
				issues.push("連続した休憩開始があります。");
			}
			breakStart = at;
			continue;
		}

		if (event.type === "BREAK_END") {
			if (!breakStart) {
				issues.push("休憩開始のない休憩終了があります。");
			} else {
				totalBreakMinutes += diffMinutes(breakStart, at);
				breakStart = null;
			}
			continue;
		}

		if (event.type === "CLOCK_OUT") {
			if (!workStart) {
				issues.push("出勤前の退勤があります。");
			} else {
				totalWorkMinutes += diffMinutes(workStart, at);
				workStart = null;
			}
		}
	}

	if (breakStart) {
		issues.push("休憩が終了していません。");
	}

	if (workStart) {
		issues.push("退勤が未打刻です。");
	}

	const openState: AttendanceDaySummary["openState"] = breakStart
		? "ON_BREAK"
		: workStart
			? "WORKING"
			: "OFF_DUTY";

	return {
		dayKey,
		totalWorkMinutes: Math.max(0, totalWorkMinutes - totalBreakMinutes),
		totalBreakMinutes,
		openState,
		issues,
		events: sorted,
	};
}

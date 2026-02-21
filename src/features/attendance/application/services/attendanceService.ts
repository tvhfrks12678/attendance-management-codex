import type { AttendanceEventType } from "../../domain/entities/attendanceEvent";
import { aggregateDay } from "../../domain/logic/aggregate";
import {
	ensureCanBreakEnd,
	ensureCanBreakStart,
	ensureCanClockIn,
	ensureCanClockOut,
} from "../../domain/logic/rules";
import type { AttendanceRepository } from "../../domain/ports/attendanceRepository";
import type { Clock } from "../../domain/ports/clock";

type Deps = {
	repo: AttendanceRepository;
	clock: Clock;
	userId: string;
};

type MutateInput = Deps & {
	type: AttendanceEventType;
	requestId: string;
};

async function mutateAttendance(input: MutateInput) {
	const at = input.clock.now().toISOString();
	const dayKey = input.clock.todayKey();
	const events = await input.repo.listEventsForDay(input.userId, dayKey);

	if (events.some((event) => event.requestId === input.requestId)) {
		return { ok: true, inserted: false };
	}

	if (input.type === "CLOCK_IN") ensureCanClockIn(events);
	if (input.type === "CLOCK_OUT") ensureCanClockOut(events);
	if (input.type === "BREAK_START") ensureCanBreakStart(events);
	if (input.type === "BREAK_END") ensureCanBreakEnd(events);

	const inserted = await input.repo.appendEventIfNew({
		userId: input.userId,
		dayKey,
		type: input.type,
		at,
		requestId: input.requestId,
	});

	return { ok: true, inserted };
}

export function clockIn(input: Deps & { requestId: string }) {
	return mutateAttendance({ ...input, type: "CLOCK_IN" });
}

export function clockOut(input: Deps & { requestId: string }) {
	return mutateAttendance({ ...input, type: "CLOCK_OUT" });
}

export function breakStart(input: Deps & { requestId: string }) {
	return mutateAttendance({ ...input, type: "BREAK_START" });
}

export function breakEnd(input: Deps & { requestId: string }) {
	return mutateAttendance({ ...input, type: "BREAK_END" });
}

export async function getTodaySummary(input: Deps) {
	const dayKey = input.clock.todayKey();
	const events = await input.repo.listEventsForDay(input.userId, dayKey);
	return aggregateDay(dayKey, events);
}

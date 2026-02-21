import { Effect } from "../../../../lib/effect";
import type {
	AttendanceEvent,
	AttendanceEventType,
} from "../../domain/entities/attendanceEvent";
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

function validateEventTransition(
	type: AttendanceEventType,
	events: AttendanceEvent[],
) {
	switch (type) {
		case "CLOCK_IN":
			ensureCanClockIn(events);
			break;
		case "CLOCK_OUT":
			ensureCanClockOut(events);
			break;
		case "BREAK_START":
			ensureCanBreakStart(events);
			break;
		case "BREAK_END":
			ensureCanBreakEnd(events);
			break;
	}
}

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

export function getTodaySummary(input: Deps) {
	const dayKeyEffect = Effect.sync(() => input.clock.todayKey());
	const summaryEffect = Effect.flatMap(dayKeyEffect, (dayKey) => {
		const listEventsEffect = Effect.tryPromise(() =>
			input.repo.listEventsForDay(input.userId, dayKey),
		);
		return Effect.map(listEventsEffect, (events) =>
			aggregateDay(dayKey, events),
		);
	});

	return Effect.runPromise(summaryEffect);
}

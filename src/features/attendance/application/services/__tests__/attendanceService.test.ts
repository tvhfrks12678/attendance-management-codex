import { describe, expect, it } from "vitest";
import type { AttendanceEvent } from "../../../domain/entities/attendanceEvent";
import type { AttendanceRepository } from "../../../domain/ports/attendanceRepository";
import type { Clock } from "../../../domain/ports/clock";
import {
	breakEnd,
	breakStart,
	clockIn,
	getTodaySummary,
} from "../attendanceService";

function fakeClock(): Clock {
	return {
		now: () => new Date("2026-02-21T09:00:00.000Z"),
		todayKey: () => "2026-02-21",
	};
}

function fakeRepo(): AttendanceRepository {
	const events: AttendanceEvent[] = [];
	return {
		async listEventsForDay(userId, dayKey) {
			return events.filter(
				(event) => event.userId === userId && event.dayKey === dayKey,
			);
		},
		async appendEventIfNew(input) {
			if (events.some((event) => event.requestId === input.requestId)) {
				return false;
			}
			events.push({
				id: crypto.randomUUID(),
				userId: input.userId,
				type: input.type,
				at: input.at,
				dayKey: input.dayKey,
				requestId: input.requestId,
				createdAt: input.at,
			});
			return true;
		},
	};
}

describe("attendanceService", () => {
	it("handles idempotent request IDs", async () => {
		const repo = fakeRepo();
		const clock = fakeClock();

		const first = await clockIn({
			repo,
			clock,
			userId: "u1",
			requestId: "req-1",
		});
		const second = await clockIn({
			repo,
			clock,
			userId: "u1",
			requestId: "req-1",
		}).catch(() => ({ ok: false, inserted: false }));

		const summary = await getTodaySummary({ repo, clock, userId: "u1" });

		expect(first.inserted).toBe(true);
		expect(second.inserted).toBe(false);
		expect(summary.events).toHaveLength(1);
	});

	it("requires break start before break end", async () => {
		const repo = fakeRepo();
		const clock = fakeClock();

		await clockIn({ repo, clock, userId: "u1", requestId: "req-1" });
		await expect(
			breakEnd({ repo, clock, userId: "u1", requestId: "req-2" }),
		).rejects.toThrow("休憩開始後のみ休憩終了できます。");

		await breakStart({ repo, clock, userId: "u1", requestId: "req-3" });
		await expect(
			breakEnd({ repo, clock, userId: "u1", requestId: "req-4" }),
		).resolves.toMatchObject({ ok: true });
	});
});

import { describe, expect, it } from "vitest";
import type { AttendanceEvent } from "../../entities/attendanceEvent";
import { aggregateDay } from "../aggregate";

function event(partial: Partial<AttendanceEvent>): AttendanceEvent {
	return {
		id: partial.id ?? crypto.randomUUID(),
		userId: partial.userId ?? "u1",
		dayKey: partial.dayKey ?? "2026-02-21",
		type: partial.type ?? "CLOCK_IN",
		at: partial.at ?? "2026-02-21T00:00:00.000Z",
		requestId: partial.requestId ?? crypto.randomUUID(),
		createdAt: partial.createdAt ?? "2026-02-21T00:00:00.000Z",
	};
}

describe("aggregateDay", () => {
	it("computes work minutes minus breaks", () => {
		const events = [
			event({ type: "CLOCK_IN", at: "2026-02-21T00:00:00.000Z" }),
			event({ type: "BREAK_START", at: "2026-02-21T02:00:00.000Z" }),
			event({ type: "BREAK_END", at: "2026-02-21T02:30:00.000Z" }),
			event({ type: "CLOCK_OUT", at: "2026-02-21T08:00:00.000Z" }),
		];

		const summary = aggregateDay("2026-02-21", events);

		expect(summary.totalBreakMinutes).toBe(30);
		expect(summary.totalWorkMinutes).toBe(450);
		expect(summary.openState).toBe("OFF_DUTY");
		expect(summary.issues).toHaveLength(0);
	});
});

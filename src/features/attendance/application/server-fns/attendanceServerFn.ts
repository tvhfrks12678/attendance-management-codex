import { createServerFn } from "@tanstack/react-start";
import { systemClock } from "../../infrastructure/clock/systemClock";
import { getAttendanceRepo } from "../../infrastructure/db/getRepo";
import {
	breakEnd,
	breakStart,
	clockIn,
	clockOut,
	getTodaySummary,
} from "../services/attendanceService";

type UserInput = { userId: string };

type ActionInput = UserInput & { requestId: string };

function assertUserInput(input: unknown): UserInput {
	if (!input || typeof input !== "object" || !("userId" in input)) {
		throw new Error("userId is required");
	}
	const userId = (input as { userId: unknown }).userId;
	if (typeof userId !== "string" || userId.length === 0) {
		throw new Error("userId must be non-empty string");
	}
	return { userId };
}

function assertActionInput(input: unknown): ActionInput {
	if (!input || typeof input !== "object" || !("requestId" in input)) {
		throw new Error("requestId is required");
	}
	const parsed = assertUserInput(input);
	const requestId = (input as { requestId: unknown }).requestId;
	if (typeof requestId !== "string" || requestId.length === 0) {
		throw new Error("requestId must be non-empty string");
	}
	return { ...parsed, requestId };
}

export const getTodaySummaryFn = createServerFn({ method: "POST" }).handler(
	async ({ data }) => {
		const parsed = assertUserInput(data);
		const repo = getAttendanceRepo();
		return getTodaySummary({ repo, clock: systemClock, userId: parsed.userId });
	},
);

export const clockInFn = createServerFn({ method: "POST" }).handler(
	async ({ data }) => {
		const parsed = assertActionInput(data);
		const repo = getAttendanceRepo();
		return clockIn({ repo, clock: systemClock, ...parsed });
	},
);

export const clockOutFn = createServerFn({ method: "POST" }).handler(
	async ({ data }) => {
		const parsed = assertActionInput(data);
		const repo = getAttendanceRepo();
		return clockOut({ repo, clock: systemClock, ...parsed });
	},
);

export const breakStartFn = createServerFn({ method: "POST" }).handler(
	async ({ data }) => {
		const parsed = assertActionInput(data);
		const repo = getAttendanceRepo();
		return breakStart({ repo, clock: systemClock, ...parsed });
	},
);

export const breakEndFn = createServerFn({ method: "POST" }).handler(
	async ({ data }) => {
		const parsed = assertActionInput(data);
		const repo = getAttendanceRepo();
		return breakEnd({ repo, clock: systemClock, ...parsed });
	},
);

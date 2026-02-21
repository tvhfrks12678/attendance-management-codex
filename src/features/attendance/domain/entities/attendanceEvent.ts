export type AttendanceEventType =
	| "CLOCK_IN"
	| "CLOCK_OUT"
	| "BREAK_START"
	| "BREAK_END";

export type AttendanceEvent = {
	id: string;
	userId: string;
	type: AttendanceEventType;
	at: string;
	dayKey: string;
	requestId: string;
	createdAt: string;
};

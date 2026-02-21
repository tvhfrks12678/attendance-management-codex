import type {
	AttendanceEvent,
	AttendanceEventType,
} from "../entities/attendanceEvent";

export type AppendAttendanceEventInput = {
	userId: string;
	dayKey: string;
	type: AttendanceEventType;
	at: string;
	requestId: string;
};

export type AttendanceRepository = {
	listEventsForDay: (
		userId: string,
		dayKey: string,
	) => Promise<AttendanceEvent[]>;
	appendEventIfNew: (input: AppendAttendanceEventInput) => Promise<boolean>;
};

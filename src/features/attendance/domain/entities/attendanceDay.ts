import type { AttendanceEvent } from "./attendanceEvent";

export type AttendanceDaySummary = {
	dayKey: string;
	totalWorkMinutes: number;
	totalBreakMinutes: number;
	openState: "OFF_DUTY" | "WORKING" | "ON_BREAK";
	issues: string[];
	events: AttendanceEvent[];
};

import type { AttendanceEvent } from "../../domain/entities/attendanceEvent";
import type {
	AppendAttendanceEventInput,
	AttendanceRepository,
} from "../../domain/ports/attendanceRepository";

type Store = Map<string, AttendanceEvent[]>;

const globalKey = "__attendanceStore";
const root = globalThis as typeof globalThis & { [globalKey]?: Store };

function getStore() {
	if (!root[globalKey]) {
		root[globalKey] = new Map<string, AttendanceEvent[]>();
	}
	return root[globalKey];
}

function key(userId: string, dayKey: string) {
	return `${userId}:${dayKey}`;
}

function createEvent(input: AppendAttendanceEventInput): AttendanceEvent {
	return {
		id: crypto.randomUUID(),
		userId: input.userId,
		dayKey: input.dayKey,
		type: input.type,
		at: input.at,
		requestId: input.requestId,
		createdAt: new Date().toISOString(),
	};
}

export function getAttendanceRepo(): AttendanceRepository {
	const store = getStore();

	return {
		async listEventsForDay(userId, dayKey) {
			const events = store.get(key(userId, dayKey)) ?? [];
			return [...events].sort((a, b) => a.at.localeCompare(b.at));
		},

		async appendEventIfNew(input) {
			const storeKey = key(input.userId, input.dayKey);
			const events = store.get(storeKey) ?? [];
			if (events.some((event) => event.requestId === input.requestId)) {
				return false;
			}
			events.push(createEvent(input));
			store.set(storeKey, events);
			return true;
		},
	};
}

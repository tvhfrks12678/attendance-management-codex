import type { AttendanceDaySummary } from "../../domain/entities/attendanceDay";

type Props = {
	summary: AttendanceDaySummary | null;
	onClockIn: () => Promise<void>;
	onClockOut: () => Promise<void>;
	onBreakStart: () => Promise<void>;
	onBreakEnd: () => Promise<void>;
};

const baseStyle =
	"px-4 py-2 rounded-md font-semibold text-white transition-colors disabled:opacity-50";

export function ClockButtons(props: Props) {
	const state = props.summary?.openState ?? "OFF_DUTY";

	return (
		<div className="flex flex-wrap gap-3">
			<button
				type="button"
				className={`${baseStyle} bg-emerald-600 hover:bg-emerald-700`}
				onClick={() => void props.onClockIn()}
				disabled={state !== "OFF_DUTY"}
			>
				出勤
			</button>
			<button
				type="button"
				className={`${baseStyle} bg-amber-500 hover:bg-amber-600`}
				onClick={() => void props.onBreakStart()}
				disabled={state !== "WORKING"}
			>
				休憩開始
			</button>
			<button
				type="button"
				className={`${baseStyle} bg-sky-600 hover:bg-sky-700`}
				onClick={() => void props.onBreakEnd()}
				disabled={state !== "ON_BREAK"}
			>
				休憩終了
			</button>
			<button
				type="button"
				className={`${baseStyle} bg-rose-600 hover:bg-rose-700`}
				onClick={() => void props.onClockOut()}
				disabled={state !== "WORKING"}
			>
				退勤
			</button>
		</div>
	);
}

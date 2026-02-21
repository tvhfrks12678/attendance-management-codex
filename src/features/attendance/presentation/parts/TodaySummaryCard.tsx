import type { AttendanceDaySummary } from "../../domain/entities/attendanceDay";

type Props = {
	summary: AttendanceDaySummary | null;
};

function formatMinutes(minutes: number) {
	const h = Math.floor(minutes / 60);
	const m = minutes % 60;
	return `${h}時間 ${m}分`;
}

const stateLabel: Record<AttendanceDaySummary["openState"], string> = {
	OFF_DUTY: "勤務外",
	WORKING: "勤務中",
	ON_BREAK: "休憩中",
};

export function TodaySummaryCard(props: Props) {
	if (!props.summary) {
		return <div className="rounded-lg border p-4">読み込み中...</div>;
	}

	return (
		<div className="rounded-lg border border-slate-700 bg-slate-900 p-4 space-y-2">
			<p className="text-slate-300">日付: {props.summary.dayKey}</p>
			<p className="text-white">状態: {stateLabel[props.summary.openState]}</p>
			<p className="text-white">
				総労働時間: {formatMinutes(props.summary.totalWorkMinutes)}
			</p>
			<p className="text-white">
				総休憩時間: {formatMinutes(props.summary.totalBreakMinutes)}
			</p>
		</div>
	);
}

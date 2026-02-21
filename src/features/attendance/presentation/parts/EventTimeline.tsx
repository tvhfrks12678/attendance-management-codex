import type { AttendanceDaySummary } from "../../domain/entities/attendanceDay";

const eventLabel = {
	CLOCK_IN: "出勤",
	CLOCK_OUT: "退勤",
	BREAK_START: "休憩開始",
	BREAK_END: "休憩終了",
} as const;

type Props = {
	summary: AttendanceDaySummary | null;
};

export function EventTimeline(props: Props) {
	return (
		<div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
			<h3 className="font-semibold text-white mb-3">打刻イベント</h3>
			<ul className="space-y-2 text-slate-200">
				{props.summary?.events.length ? (
					props.summary.events.map((event) => (
						<li key={event.id} className="flex justify-between text-sm">
							<span>{eventLabel[event.type]}</span>
							<span>{new Date(event.at).toLocaleTimeString("ja-JP")}</span>
						</li>
					))
				) : (
					<li className="text-slate-400 text-sm">まだ打刻がありません。</li>
				)}
			</ul>
			{Boolean(props.summary?.issues.length) && (
				<div className="mt-4">
					<p className="text-rose-300 text-sm mb-1">整合性アラート</p>
					<ul className="list-disc list-inside text-rose-200 text-sm">
						{props.summary?.issues.map((issue) => (
							<li key={issue}>{issue}</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
}

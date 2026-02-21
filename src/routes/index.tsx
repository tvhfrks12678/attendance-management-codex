import { createFileRoute } from "@tanstack/react-router";
import { useAttendance } from "@/features/attendance/presentation/hooks/useAttendance";
import { ClockButtons } from "@/features/attendance/presentation/parts/ClockButtons";
import { EventTimeline } from "@/features/attendance/presentation/parts/EventTimeline";
import { TodaySummaryCard } from "@/features/attendance/presentation/parts/TodaySummaryCard";

export const Route = createFileRoute("/")({ component: App });

function App() {
	const attendance = useAttendance();

	return (
		<div className="min-h-screen bg-slate-950 text-white p-6">
			<main className="max-w-3xl mx-auto space-y-6">
				<header className="space-y-2">
					<h1 className="text-3xl font-bold">
						出勤管理アプリ（イベントソーシング）
					</h1>
					<p className="text-slate-300 text-sm">
						applicationはユースケースとして純粋に保ち、server
						functionを薄いトランスポート層に分離した構成です。
					</p>
				</header>

				{attendance.error && (
					<p className="rounded-md border border-rose-500 bg-rose-950 p-3 text-rose-200 text-sm">
						{attendance.error}
					</p>
				)}

				<TodaySummaryCard summary={attendance.summary} />

				<ClockButtons
					summary={attendance.summary}
					onClockIn={attendance.clockIn}
					onClockOut={attendance.clockOut}
					onBreakStart={attendance.breakStart}
					onBreakEnd={attendance.breakEnd}
				/>

				<button
					type="button"
					className="rounded-md px-3 py-2 bg-slate-700 hover:bg-slate-600 text-sm"
					onClick={() => void attendance.refresh()}
					disabled={attendance.loading}
				>
					再取得
				</button>

				<EventTimeline summary={attendance.summary} />
			</main>
		</div>
	);
}

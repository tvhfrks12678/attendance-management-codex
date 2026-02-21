import { useCallback, useEffect, useMemo, useState } from "react";
import {
	breakEndFn,
	breakStartFn,
	clockInFn,
	clockOutFn,
	getTodaySummaryFn,
} from "../../application/server-fns/attendanceServerFn";
import type { AttendanceDaySummary } from "../../domain/entities/attendanceDay";

const USER_ID = "demo-user";

function randomRequestId() {
	return crypto.randomUUID();
}

export function useAttendance() {
	const [summary, setSummary] = useState<AttendanceDaySummary | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refresh = useCallback(async () => {
		setLoading(true);
		try {
			const response = await getTodaySummaryFn({ data: { userId: USER_ID } });
			setSummary(response);
			setError(null);
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "取得に失敗しました。");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	const runAction = useCallback(
		async (
			action: (input: {
				data: { userId: string; requestId: string };
			}) => Promise<unknown>,
		) => {
			try {
				await action({
					data: { userId: USER_ID, requestId: randomRequestId() },
				});
				setError(null);
				await refresh();
			} catch (cause) {
				setError(
					cause instanceof Error ? cause.message : "打刻に失敗しました。",
				);
			}
		},
		[refresh],
	);

	return useMemo(
		() => ({
			summary,
			loading,
			error,
			refresh,
			clockIn: () => runAction(clockInFn),
			clockOut: () => runAction(clockOutFn),
			breakStart: () => runAction(breakStartFn),
			breakEnd: () => runAction(breakEndFn),
		}),
		[summary, loading, error, refresh, runAction],
	);
}

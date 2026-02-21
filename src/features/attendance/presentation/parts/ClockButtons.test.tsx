// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ClockButtons } from "./ClockButtons";

describe("ClockButtons", () => {
	it("displays all attendance action buttons", () => {
		render(
			<ClockButtons
				summary={null}
				onClockIn={vi.fn().mockResolvedValue(undefined)}
				onClockOut={vi.fn().mockResolvedValue(undefined)}
				onBreakStart={vi.fn().mockResolvedValue(undefined)}
				onBreakEnd={vi.fn().mockResolvedValue(undefined)}
			/>,
		);

		expect(screen.getByRole("button", { name: "出勤" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "休憩開始" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "休憩終了" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "退勤" })).toBeTruthy();
	});
});

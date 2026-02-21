import { expect, test } from "@playwright/test";

test("shows a record after clock-in button click", async ({ page }) => {
	await page.goto("/");

	await expect(page.getByRole("button", { name: "出勤" })).toBeVisible();
	await expect(page.getByText("まだ打刻がありません。")).toBeVisible();

	await page.getByRole("button", { name: "出勤" }).click();

	await expect(page.getByText("まだ打刻がありません。")).toHaveCount(0);
	await expect(page.getByRole("listitem").filter({ hasText: "出勤" })).toBeVisible();
});

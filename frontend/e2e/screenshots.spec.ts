import { test } from "@playwright/test";
import path from "node:path";
import { login } from "./helpers";

// Captures the real running application for the README. Requires the stack with demo data loaded.
const OUT = path.resolve(__dirname, "../../screenshots");
const shot = (name: string) => ({ path: path.join(OUT, `${name}.png`), fullPage: true });

test.describe("screenshots", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("desktop", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Username").waitFor();
    await page.screenshot(shot("01-login"));

    await login(page);
    await page.getByText("Employees by department").waitFor();
    await page.getByText("Recently joined").waitFor();
    await page.waitForTimeout(600);
    await page.screenshot(shot("02-dashboard"));

    await page.goto("/employees");
    await page.getByTestId("employee-row").first().waitFor();
    await page.screenshot(shot("03-employee-list"));

    await page.goto("/employees?department=Engineering&status=ACTIVE&sortBy=salary&sortDir=desc");
    await page.getByTestId("employee-row").first().waitFor();
    await page.screenshot(shot("04-employee-list-filtered"));

    await page.goto("/employees/new");
    await page.getByLabel("Employee ID").waitFor();
    await page.getByRole("button", { name: "Create employee" }).click(); // show validation messages
    await page.getByText("Employee ID is required").waitFor();
    await page.screenshot(shot("05-add-employee-validation"));

    await page.goto("/employees?search=Ananya");
    await page.getByRole("link", { name: "Ananya Iyer" }).first().click();
    await page.getByRole("heading", { name: /Ananya Iyer/ }).waitFor();
    await page.screenshot(shot("06-employee-details"));

    await page.getByRole("link", { name: "Edit" }).click();
    await page.getByLabel("Full name").waitFor();
    await page.getByLabel("Full name").fill("Ananya R. Iyer");
    await page.screenshot(shot("07-edit-employee"));

    await page.goto("/employees");
    await page.getByRole("button", { name: /^Delete / }).first().click();
    await page.getByRole("alertdialog").waitFor();
    await page.screenshot(shot("08-delete-confirmation"));

    await page.goto("/departments");
    await page.getByRole("table", { name: "Departments" }).waitFor();
    await page.screenshot(shot("09-departments"));
  });

  test.describe("mobile", () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

    test("layouts", async ({ page }) => {
      await login(page);
      await page.getByText("Employees by department").waitFor();
      await page.waitForTimeout(600);
      await page.screenshot(shot("10-mobile-dashboard"));
      await page.goto("/employees");
      await page.getByTestId("employee-row").first().waitFor();
      await page.screenshot(shot("11-mobile-employee-list"));
    });
  });

  test.describe("tablet", () => {
    test.use({ viewport: { width: 820, height: 1180 } });

    test("layouts", async ({ page }) => {
      await login(page, "/employees");
      await page.getByTestId("employee-row").first().waitFor();
      await page.screenshot(shot("12-tablet-employee-list"));
    });
  });
});

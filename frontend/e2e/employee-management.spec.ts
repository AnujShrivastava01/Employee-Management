import { expect, test } from "@playwright/test";
import fs from "node:fs";
import { ADMIN_USER, login } from "./helpers";

// Smoke tests against the REAL stack (Next.js -> Spring Boot -> PostgreSQL) with demo data loaded.

test.describe("authentication", () => {
  test("anonymous visitors are sent to the login page and back after signing in", async ({ page }) => {
    await page.goto("/employees");
    await expect(page).toHaveURL(/\/login\?next=%2Femployees/);

    await page.getByLabel("Username").fill(ADMIN_USER);
    await page.getByLabel("Password").fill("definitely-wrong");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.locator("form").getByRole("alert")).toContainText("Invalid username or password");

    await login(page, "/employees");
    await expect(page).toHaveURL(/\/employees$/);
    await expect(page.getByRole("heading", { name: "Employees", level: 1 })).toBeVisible();
  });

  test("signing out ends the session", async ({ page }) => {
    await login(page);
    await page.getByRole("button", { name: "Account menu" }).click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/login/);
    await page.goto("/employees");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("dashboard", () => {
  test("shows statistics that match the employee directory", async ({ page }) => {
    await login(page);
    const total = Number(await page.getByTestId("stat-total-employees").innerText());
    const active = Number(await page.getByTestId("stat-active-employees").innerText());
    const inactive = Number(await page.getByTestId("stat-inactive-employees").innerText());
    expect(total).toBeGreaterThan(0);
    expect(active + inactive).toBe(total);
    await expect(page.getByText("Employees by department")).toBeVisible();
    await expect(page.getByText("Recently joined")).toBeVisible();

    await page.getByRole("link", { name: "View employees" }).click();
    await expect(page.getByText(new RegExp(`${total} people across your organisation`))).toBeVisible();
  });
});

test.describe("employee directory", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "/employees");
    await expect(page.getByTestId("employee-row").first()).toBeVisible();
  });

  test("server-side pagination, page size and sorting", async ({ page }) => {
    await expect(page.getByTestId("employee-row")).toHaveCount(10);
    await expect(page.getByRole("navigation", { name: "Pagination" })).toBeVisible();

    await page.getByRole("button", { name: "Next page" }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByText(/^11–20/)).toBeVisible();

    await page.getByLabel("Rows per page").selectOption("20");
    await expect(page).toHaveURL(/size=20/);
    await expect(page).not.toHaveURL(/page=/);
    await expect(page.getByTestId("employee-row")).toHaveCount(20);

    await page.getByRole("button", { name: /Salary/ }).click();
    await page.getByRole("button", { name: /Salary/ }).click(); // descending
    await expect(page).toHaveURL(/sortBy=salary&sortDir=desc/);
    await expect(page.getByTestId("employee-row").first()).toContainText("₹45,00,000");
  });

  test("search, department and status filters work together and can be cleared", async ({ page }) => {
    await page.getByLabel("Filter by department").selectOption("Engineering");
    await page.getByLabel("Filter by status").selectOption("ACTIVE");
    await expect(page).toHaveURL(/department=Engineering/);
    await expect(page).toHaveURL(/status=ACTIVE/);
    const rows = page.getByTestId("employee-row");
    await expect(rows.first()).toBeVisible();
    for (const text of await rows.allInnerTexts()) {
      expect(text).toContain("Engineering");
      expect(text).not.toContain("Inactive");
    }

    await page.getByLabel("Search employees", { exact: true }).fill("iyer");
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText("Ananya Iyer");

    await page.getByLabel("Search employees", { exact: true }).fill("no-such-person-xyz");
    await expect(page.getByText("No matching employees")).toBeVisible();

    await page.getByRole("button", { name: "Clear filters" }).first().click();
    await expect(page.getByTestId("employee-row").first()).toBeVisible();
    await expect(page).not.toHaveURL(/search=|department=|status=/);
  });

  test("exports the filtered rows as a CSV file", async ({ page }) => {
    await page.getByLabel("Filter by department").selectOption("Design");
    await expect(page.getByTestId("employee-row")).toHaveCount(3);

    const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: /Export CSV/ }).click()]);

    expect(download.suggestedFilename()).toMatch(/^employees-\d{4}-\d{2}-\d{2}\.csv$/);
    const csv = fs.readFileSync((await download.path())!, "utf8");
    const lines = csv.replace(/^﻿/, "").trim().split("\r\n");
    expect(lines[0]).toBe("Employee ID,Full Name,Email,Phone,Department,Designation,Date of Joining,Salary (INR),Status");
    expect(lines).toHaveLength(4); // header + 3 Design employees
    expect(lines.slice(1).every((line) => line.includes(",Design,"))).toBe(true);
  });
});

test.describe("employee lifecycle", () => {
  test("create → view → edit → delete (with confirmation) against the real API", async ({ page }) => {
    const suffix = Date.now().toString().slice(-7);
    const employeeId = `E2E-${suffix}`;
    const email = `e2e.${suffix}@example.com`;
    page.on("dialog", (dialog) => dialog.accept()); // the form's "unsaved changes" prompt when navigating away mid-edit
    await login(page, "/employees/new");

    // Client-side validation first
    await page.getByRole("button", { name: "Create employee" }).click();
    await expect(page.getByText("Full name is required")).toBeVisible();

    await page.getByLabel(/^Employee ID/).fill(employeeId);
    await page.getByLabel(/^Full name/).fill("Test Candidate");
    await page.getByLabel(/^Email address/).fill(email);
    await page.getByLabel(/^Phone number/).fill("+91 90000 11111");
    await page.getByLabel(/^Department/).selectOption({ label: "Product" });
    await page.getByLabel(/^Designation/).fill("QA Lead");
    await page.getByLabel(/^Date of joining/).fill("2024-02-10");
    await page.getByLabel(/^Annual salary/).fill("1234567.5");
    await page.getByRole("button", { name: "Create employee" }).click();

    // Details page
    await expect(page).toHaveURL(/\/employees\/\d+$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Test Candidate");
    await expect(page.getByText("₹12,34,567.5")).toBeVisible();
    await expect(page.getByText("10 Feb 2024")).toBeVisible();
    const detailsUrl = page.url();

    // Duplicate employee ID is rejected by the server and shown on the field
    await page.goto("/employees/new");
    await page.getByLabel(/^Employee ID/).fill(employeeId.toLowerCase());
    await page.getByLabel(/^Full name/).fill("Someone Else");
    await page.getByLabel(/^Email address/).fill(`other.${suffix}@example.com`);
    await page.getByLabel(/^Phone number/).fill("+91 90000 22222");
    await page.getByLabel(/^Department/).selectOption({ label: "Product" });
    await page.getByLabel(/^Designation/).fill("Analyst");
    await page.getByLabel(/^Date of joining/).fill("2024-02-11");
    await page.getByLabel(/^Annual salary/).fill("500000");
    await page.getByRole("button", { name: "Create employee" }).click();
    await expect(page.getByText(`Employee ID ${employeeId} is already in use`)).toBeVisible();
    await expect(page.getByLabel(/^Full name/)).toHaveValue("Someone Else");

    // It is searchable in the directory
    await page.goto(`/employees?search=${suffix}`);
    await expect(page.getByTestId("employee-row")).toHaveCount(1);

    // Edit
    await page.goto(detailsUrl);
    await page.getByRole("link", { name: "Edit" }).click();
    await expect(page.getByLabel(/^Full name/)).toHaveValue("Test Candidate");
    await page.getByLabel(/^Full name/).fill("Test Candidate Edited");
    await page.getByLabel(/^Employment status/).selectOption("INACTIVE");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page).toHaveURL(detailsUrl);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Test Candidate Edited");
    await expect(page.getByText("Inactive").first()).toBeVisible();

    // Delete requires confirmation
    await page.getByRole("button", { name: /Delete/ }).click();
    await expect(page.getByRole("alertdialog")).toContainText("This action cannot be undone");
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("alertdialog")).toBeHidden();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Test Candidate Edited");

    await page.getByRole("button", { name: /Delete/ }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete employee" }).click();
    await expect(page).toHaveURL(/\/employees$/);

    await page.goto(detailsUrl);
    await expect(page.getByText("Employee not found")).toBeVisible();
  });
});

test.describe("responsive layout", () => {
  for (const [name, viewport] of [["mobile", { width: 390, height: 844 }], ["tablet", { width: 820, height: 1180 }]] as const) {
    test(`${name}: no horizontal page overflow and actions stay reachable`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await login(page);
      await expect(page.getByTestId("stat-total-employees")).toBeVisible();
      await page.getByText("Employees by department").scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

      await page.goto("/employees");
      const firstRow = page.getByTestId("employee-row").first();
      await expect(firstRow).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      const del = firstRow.getByRole("button", { name: /^Delete / });
      await expect(del).toBeInViewport();
    });
  }

  test("mobile navigation opens as a drawer", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page);
    await page.getByRole("button", { name: "Open navigation" }).click();
    await page.getByRole("dialog").getByRole("link", { name: "Departments" }).click();
    await expect(page).toHaveURL(/\/departments$/);
    await expect(page.getByRole("table", { name: "Departments" })).toBeVisible();
  });
});

import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { safeRedirectPath } from "@/lib/auth";
import { createFakeApi } from "@/test/fake-api";
import { currentUrl, setUrl } from "@/test/navigation-mock";
import { renderWithProviders } from "@/test/render";
import { LoginForm } from "./login-form";

vi.mock("next/navigation", async () => await import("@/test/navigation-mock"));

describe("safeRedirectPath", () => {
  it("only allows same-site relative paths", () => {
    expect(safeRedirectPath("/employees?page=2")).toBe("/employees?page=2");
    expect(safeRedirectPath("//evil.example")).toBe("/");
    expect(safeRedirectPath("https://evil.example")).toBe("/");
    expect(safeRedirectPath("/login")).toBe("/");
    expect(safeRedirectPath(null)).toBe("/");
  });
});

describe("<LoginForm>", () => {
  beforeEach(() => setUrl("/login?next=%2Femployees"));

  it("requires both fields", async () => {
    createFakeApi({ authenticated: false }).install();
    const { user } = renderWithProviders(<LoginForm />);

    await user.click(await screen.findByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Username is required")).toBeInTheDocument();
    expect(screen.getByText("Password is required")).toBeInTheDocument();
  });

  it("shows a generic message for bad credentials and stays on the page", async () => {
    const api = createFakeApi({ authenticated: false });
    api.install();
    const { user } = renderWithProviders(<LoginForm />);

    await user.type(await screen.findByLabelText("Username"), "admin");
    await user.type(screen.getByLabelText("Password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid username or password");
    expect(currentUrl()).toContain("/login");
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
  });

  it("signs in and returns to the originally requested page", async () => {
    const api = createFakeApi({ authenticated: false });
    api.install();
    const { user } = renderWithProviders(<LoginForm />);

    await user.type(await screen.findByLabelText("Username"), "admin");
    await user.type(screen.getByLabelText("Password"), "correct-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(currentUrl()).toBe("/employees"));
    expect(api.calls("POST", /login/)[0]!.headers["X-XSRF-TOKEN"]).toBe("test-csrf-token");
  });
});

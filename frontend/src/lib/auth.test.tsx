import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { createFakeApi } from "@/test/fake-api";
import { AuthProvider, useAuth } from "./auth";

vi.mock("next/navigation", async () => await import("@/test/navigation-mock"));

function Probe() {
  const { user, isLoading, login, logout } = useAuth();
  return (
    <div>
      <p data-testid="who">{isLoading ? "loading" : (user?.username ?? "anonymous")}</p>
      <button onClick={() => login("admin", "correct-password")}>login</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  );
}

function setup(authenticated: boolean) {
  const api = createFakeApi({ authenticated });
  api.install();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const user = userEvent.setup();
  render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <Probe />
      </AuthProvider>
    </QueryClientProvider>,
  );
  return { api, client, user };
}

describe("AuthProvider", () => {
  it("starts anonymous when there is no session", async () => {
    setup(false);
    await waitFor(() => expect(screen.getByTestId("who")).toHaveTextContent("anonymous"));
  });

  it("starts signed in when a session exists", async () => {
    setup(true);
    await waitFor(() => expect(screen.getByTestId("who")).toHaveTextContent("admin"));
  });

  it("reflects a successful login immediately and keeps it (no stale anonymous state)", async () => {
    const { user } = setup(false);
    await waitFor(() => expect(screen.getByTestId("who")).toHaveTextContent("anonymous"));

    await user.click(screen.getByRole("button", { name: "login" }));

    await waitFor(() => expect(screen.getByTestId("who")).toHaveTextContent("admin"));
    // still signed in a moment later, i.e. nothing flips it back to anonymous
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(screen.getByTestId("who")).toHaveTextContent("admin");
  });

  it("drops cached data from the previous session when logging in or out", async () => {
    const { user, client } = setup(true);
    await waitFor(() => expect(screen.getByTestId("who")).toHaveTextContent("admin"));
    client.setQueryData(["employees", "list"], { secret: "previous user's data" });

    await user.click(screen.getByRole("button", { name: "logout" }));

    await waitFor(() => expect(screen.getByTestId("who")).toHaveTextContent("anonymous"));
    expect(client.getQueryData(["employees", "list"])).toBeUndefined();
  });

  it("treats a 401 from any API call as an expired session", async () => {
    const { api } = setup(true);
    await waitFor(() => expect(screen.getByTestId("who")).toHaveTextContent("admin"));
    api.state.authenticated = false;

    const { request } = await import("./api/client");
    await request("/departments").catch(() => undefined);

    await waitFor(() => expect(screen.getByTestId("who")).toHaveTextContent("anonymous"));
  });
});

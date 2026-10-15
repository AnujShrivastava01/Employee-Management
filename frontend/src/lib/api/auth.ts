import { ApiError, request } from "./client";
import type { CurrentUser } from "./types";

export const authApi = {
  /** Resolves to null when nobody is signed in instead of throwing. */
  me: async (signal?: AbortSignal): Promise<CurrentUser | null> => {
    try {
      return await request<CurrentUser>("/auth/me", { signal, skipUnauthorizedHandler: true });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return null;
      throw error;
    }
  },

  login: (username: string, password: string) =>
    request<CurrentUser>("/auth/login", { method: "POST", body: { username, password }, skipUnauthorizedHandler: true }),

  logout: () => request<void>("/auth/logout", { method: "POST", skipUnauthorizedHandler: true }),
};

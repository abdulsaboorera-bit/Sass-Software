export interface CurrentUserResponse {
  user?: {
    user: { id: string; name: string; email: string; role: string };
    tenant: { id: string; slug: string; name: string; industry: string; plan: string } | null;
    permissions: string[];
  } | null;
}

let currentUserRequest: Promise<CurrentUserResponse> | null = null;

export function getCurrentUser(): Promise<CurrentUserResponse> {
  if (!currentUserRequest) {
    currentUserRequest = fetch("/api/me", { credentials: "include" })
      .then((response) => response.json())
      .catch((error) => {
        currentUserRequest = null;
        throw error;
      });
  }
  return currentUserRequest;
}

export function clearCurrentUserCache() {
  currentUserRequest = null;
}

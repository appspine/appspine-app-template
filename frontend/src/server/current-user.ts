import { type CurrentUser, createGetCurrentUser } from "@appspine/frontend-shell/server";

import { apiFetch } from "./api-client";

export type { CurrentUser };
export const getCurrentUser = createGetCurrentUser(apiFetch);

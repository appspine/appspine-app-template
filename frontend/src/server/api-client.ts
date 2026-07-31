import {
  ApiError,
  type ApiErrorBody,
  createApiFetch,
  type ListQuery,
  type PaginatedResult,
  toQueryString,
} from "@appspine/frontend-shell";

import { getAccessToken } from "@/auth";

export type { ApiErrorBody, ListQuery, PaginatedResult };
export { ApiError, toQueryString };

export const apiFetch = createApiFetch({
  getAccessToken,
});

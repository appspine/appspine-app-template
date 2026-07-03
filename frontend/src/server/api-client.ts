import { getAuthToken } from "./auth-cookie";

// Server-only: reads the httpOnly auth cookie via next/headers (through getAuthToken),
// so apiFetch must only be called from Server Components / Server Actions / Route
// Handlers — never imported into a "use client" module.

function readRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const API_BASE_URL = readRequiredEnv("NEXT_PUBLIC_API_URL");

// Mirrors the JSON shape written by @appspine/common's GlobalExceptionFilter
// (packages/common/src/filters/exception.filter.ts).
export interface ApiErrorBody {
  statusCode: number;
  message: string;
  details?: unknown;
  traceId: string;
  timestamp: string;
  path: string;
}

export class ApiError extends Error {
  readonly statusCode: number;
  readonly details?: unknown;
  readonly traceId: string;

  constructor(body: ApiErrorBody) {
    super(body.message);
    this.name = "ApiError";
    this.statusCode = body.statusCode;
    this.details = body.details;
    this.traceId = body.traceId;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAuthToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw new ApiError(
      body ?? {
        statusCode: res.status,
        message: res.statusText || `HTTP ${res.status}`,
        traceId: "",
        timestamp: new Date().toISOString(),
        path,
      },
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// Mirrors @appspine/common's PaginationQuery / PaginatedResult
// (packages/common/src/pagination.ts) so the frontend list pages and backend
// pagination endpoints share one contract.
export interface PaginatedResult<T> {
  data: T[];
  total: number;
}

export interface ListQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortField?: string;
  sortOrder?: "ASC" | "DESC";
}

export function toQueryString(params?: ListQuery): string {
  if (!params) return "";
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") q.set(key, String(value));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

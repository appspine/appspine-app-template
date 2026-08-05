# appspine-app-template — Agent Guide

Welcome to the development guide for the business systems built using the appspine template.

## Technology Stack

This application consists of two main components:
- **Frontend**: A modern dashboard application built with Next.js 16, Tailwind CSS v4, and shadcn/ui.
- **Backend**: A NestJS API framework powered by Prisma ORM for database modeling and access.

For setting up the environment, local database, dependencies, and launching the services, please refer to the Quick Start guide in the root [README.md](../README.md).

## Shared Framework Packages

The backend comes pre-integrated with several `@appspine/*` packages located in the upstream monorepo:
- **Auth (`@appspine/auth`)**: OIDC-only authentication through an external identity provider such as Keycloak; local email/password credentials are retired.
- **RBAC (`@appspine/rbac`)**: Manages custom roles and permission mappings. Offers guards like `AdminGuard` and `PermissionGuard` to enforce access controls.
- **M2M API Key (`@appspine/m2m-api-key`)**: Handles machine-to-machine client API keys, rate-limiting, and scoped endpoint access. API keys may optionally bind `actingUserId` for identity-bound writes, but only to dedicated service-account users (`User.isServiceAccount = true`); use `resolveActingUserId()` from `@appspine/auth` as the fail-closed identity resolver in write paths.
- **Audit Log (`@appspine/audit-log`)**: Records key system events directly to the local database.
- **Health Check (`@appspine/health-check`)**: Exposes system health checks at `GET /health` with DB connection pinging.
- **Metadata Schema (`@appspine/metadata-schema`)**: Generates model-driven schema descriptions from Prisma DMMF, exposed at `GET /metadata/schema`.
- **MCP Server (`@appspine/mcp-server`)**: Runs a Model Context Protocol endpoint at `POST /mcp` that allows the system to register and expose customized AI tools to agents.
- **Domain Events (`@appspine/domain-events`)**: A transaction-bound outbox for derived side effects (webhooks, cross-system notifications, future workflow signals) — business write and event commit together, a background dispatcher delivers with retry/dead-letter. Already wired (`backend/src/domain-events/domain-events.module.ts`) but the handler registry starts empty; see [domain-events.md](domain-events.md) for how to record your first event.

## Development Conventions

Full naming, directory, lint, Prisma, API design, Git/commit, testing, and frontend-component
conventions — plus the standard flow for adding a new CRUD module — live in
[conventions.md](conventions.md). Read it before starting implementation work.

## App Positioning

<!-- TODO(scaffold): Fill in this app's positioning after running scaffold-init.
     Describe the business domain and the core modules this system owns.
     This is one item on a larger list — see README.md's "Before you ship — documentation checklist"
     under "Forking this template" for the rest (API/MCP tools tables, data-dictionary regen, etc). -->

## Shared notifications

The scaffold includes the standard `Notification` schema and generic inbox controller backed by
`@appspine/notification`, with `app-notifications:read/write` scopes and recipient-owned mutations. The
dashboard uses `@appspine/frontend-shell/notification`; forks should keep notification writes synchronous
with their triggering transaction and use stable idempotency keys for each producer.

---

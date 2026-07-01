# appspine-app-template — Agent Guide

Welcome to the development guide for the business systems built using the appspine template.

## Technology Stack

This application consists of two main components:
- **Frontend**: A modern dashboard application built with Next.js 16, Tailwind CSS v4, and shadcn/ui.
- **Backend**: A NestJS API framework powered by Prisma ORM for database modeling and access.

For setting up the environment, local database, dependencies, and launching the services, please refer to the Quick Start guide in the root [README.md](../README.md).

## Shared Framework Packages

The backend comes pre-integrated with several `@appspine/*` packages located in the upstream monorepo:
- **Auth (`@appspine/auth`)**: Supports both local credentials (JWT HS256) and OpenID Connect (OIDC) through external identity providers (e.g., Keycloak).
- **RBAC (`@appspine/rbac`)**: Manages custom roles and permission mappings. Offers guards like `AdminGuard` and `PermissionGuard` to enforce access controls.
- **M2M API Key (`@appspine/m2m-api-key`)**: Handles machine-to-machine client API keys, rate-limiting, and scoped endpoint access.
- **Audit Log (`@appspine/audit-log`)**: Records key system events directly to the local database.
- **Health Check (`@appspine/health-check`)**: Exposes system health checks at `GET /health` with DB connection pinging.
- **Metadata Schema (`@appspine/metadata-schema`)**: Generates model-driven schema descriptions from Prisma DMMF, exposed at `GET /metadata/schema`.
- **MCP Server (`@appspine/mcp-server`)**: Runs a Model Context Protocol endpoint at `POST /mcp` that allows the system to register and expose customized AI tools to agents.

## Development Conventions

When developing new business features or CRUD modules in this project:
1. **CRUD Modules standard flow**: Create your DB models, run prisma migration, implement module/service/controller in backend, write API tests, and design matching frontend pages.
2. **Naming Conventions**: Follow kebab-case for filenames, camelCase for variables/functions, PascalCase for classes/types, and UPPER_SNAKE_CASE for constants.
3. **Database Rules**: All database schemas are managed inside `backend/prisma/schema/`. Never manually edit `docs/data-dictionary.md` as it is auto-generated.

For complete, detailed instructions on conventions and standard procedures, refer to the upstream workspace guide:
`dev_docs/002-app-dev-conventions.md` in the `appspine` workspace root (the local workspace this repo was forked from; not tracked inside this repo or the `appspine`/`appspine-app-template` GitHub repos).

## App Positioning

<!-- TODO(scaffold): Fill in this app's positioning after running scaffold-init.
     Describe the business domain and the core modules this system owns. -->

---

# Web Baby Tracker Endpoints

This folder contains Convex backend endpoints for the **web app** version of the baby tracker. These endpoints mirror the functionality available in the mobile app but are implemented independently — no code is shared between mobile and web.

## Conventions

### File Naming
- Each domain (activities, family, device) gets its own file: `activities.ts`, `family.ts`, `device.ts`.
- New domains get new files following the same pattern.

### Endpoint Naming
- Web endpoints use the prefix path `web/babyTracker/` (derived from the folder structure).
- Endpoint names mirror the mobile equivalents where applicable (e.g., `create`, `get`, `update`, `delete`).

### Architecture
- Web endpoints follow clean architecture principles:
  - **Domain layer** (`services/backend/src/domain/`): entities, use cases, repository interfaces.
  - **Infrastructure layer** (`services/backend/src/infra/`): repository implementations (Convex DB access).
- No shared code with the mobile Convex functions in the root `convex/` directory.

### Validation
- Input validation is performed at the endpoint boundary using Convex argument validators (`v` from `convex/values`).
- Business logic validation lives in use cases.

### Authentication / Authorization
- All web endpoints are public (no built-in auth) — authorization is handled per-endpoint via device/family checks as needed.

### Schema
- Web endpoints share the same Convex schema defined in `convex/schema.ts`.

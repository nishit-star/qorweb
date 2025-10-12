# Repository Guidelines

## Project Structure & Module Organization

- Root: `./` contains this AGENTS.md and README.md
- Backend (per README): `backend/`
  - `backend/src/routes/` – API route definitions
  - `backend/src/controllers/` – request handlers
  - `backend/src/services/` – business logic
  - `backend/src/models/` – database schemas
  - `backend/src/utils/` – helpers
  - `backend/src/middleware/` – auth, errors
  - `backend/src/config/` – configuration
  - `backend/src/server.js` – Express server entry
- Frontend (per README): `frontend/`
  - `frontend/src/components/`, `frontend/src/pages/`, `frontend/src/services/`, `frontend/src/hooks/`, `frontend/src/utils/`, `frontend/src/main.jsx`
- Current Next.js remnants (observed): `app/`, `components/`, `lib/`, `migrations/`, `types/`, and a `.next/` build output exist in this repo.

## Build, Test, and Development Commands

```bash
# Backend dev (from README)
cd backend && npm install && npm run dev

# Backend DB operations (from README)
cd backend && npm run db:generate && npm run db:push && npm run db:studio

# Frontend dev (from README)
cd frontend && npm install && npm run dev

# Frontend build (from README)
cd frontend && npm run build
```

## Coding Style & Naming Conventions

- Indentation: Not explicitly specified in files found. Follow common JS/TS: 2 spaces.
- File naming: Use kebab-case for directories and files (e.g., `brand-monitor`, `server.js`) as seen in paths.
- Function/variable naming: camelCase for functions and variables; PascalCase for React components (per conventional React).
- Linting: No explicit config files detected in root; adhere to standard ESLint/Prettier conventions if present inside frontend/backend.

## Testing Guidelines

- Framework: Not specified in available files. If present, tests would live alongside source or under `backend/tests` or `frontend/src/__tests__` by convention.
- Running tests: Not documented in README; check `backend/package.json` or `frontend/package.json` when available.
- Coverage: No requirement documented.

## Commit & Pull Request Guidelines

- Commits: Use clear, descriptive messages (e.g., "feat: add brand monitor analyze route", "fix: auth session endpoint").
- PRs: Ensure app builds locally; include description, testing notes; reference related issues. Follow the restructure described in README when modifying architecture.
- Branch naming: Use prefixes like `feat/`, `fix/`, `chore/`, `docs/`.

---

# Repository Tour

## 🎯 What This Repository Does

FireGEO is a web application split into a React frontend and a Node.js backend (Express) implementing an MVC architecture, providing authentication, AI chat, brand monitoring, and billing features.

Key responsibilities:
- Provide RESTful API endpoints for auth, chat, user profile, and brand monitoring (backend)
- Deliver a modern React UI with a blue gradient theme (frontend)
- Integrate billing (Autumn) and multi-provider AI via AI SDK

---

## 🏗️ Architecture Overview

The repository is transitioning from an older Next.js app (app/ + .next/) to a separated frontend (Vite/React) and backend (Express) per README.

### System Context
```
[Browser/Frontend (React)] → [Backend (Express API)] → [PostgreSQL]
                                   ↓
                          [Autumn Billing] / [AI Providers]
```

### Key Components
- Backend Express API – routes/controllers/services/models as per README structure
- Frontend React SPA – components/pages/services/hooks
- Database – PostgreSQL accessed via Drizzle ORM
- Integrations – Better Auth (auth), Autumn (billing), AI SDK (LLM providers)

### Data Flow
1. Frontend calls backend endpoints (e.g., /api/auth, /api/chat, /api/brand-monitor)
2. Backend validates/authenticates requests (Better Auth), executes business logic
3. Backend persists/reads data via Drizzle/PostgreSQL
4. Responses returned to frontend; UI updates via React Query/TanStack Query

---

## 📁 Project Structure [Partial Directory Tree]

Observed and documented structure (mix of current files and intended target per README):

```
./
├── README.md
├── AGENTS.md (this file)
├── app/                    # Next.js app router (currently present)
├── components/             # UI components (present)
├── lib/                    # Libraries (present)
├── migrations/             # DB migrations (present)
├── types/                  # Type definitions (present)
├── .next/                  # Next.js build output (present)
├── backend/                # Intended Express API (per README)
│   └── src/ (routes, controllers, services, models, utils, middleware, config, server.js)
├── frontend/               # Intended React SPA (per README)
│   └── src/ (components, pages, services, hooks, utils, main.jsx)
└── aeo report/             # Output artifacts (logs/exports)
```

### Key Files to Know

| File | Purpose | When You'd Touch It |
|------|---------|---------------------|
| `backend/src/server.js` | Express app entry | Add middleware, bind routes, server config |
| `backend/src/routes/*` | Route definitions | Add/modify API endpoints |
| `backend/src/controllers/*` | Request handlers | Implement endpoint behavior |
| `backend/src/services/*` | Business logic | Add business rules/integrations |
| `backend/src/models/*` | DB schemas | Change data model |
| `frontend/src/main.jsx` | React entry | Global providers, app bootstrapping |
| `frontend/src/pages/*` | Pages | Add new routes/screens |
| `frontend/src/services/*` | API clients | Change backend interaction |
| `frontend/src/components/*` | Reusable UI | Build UI components |
| `README.md` | High-level guide | Update onboarding docs |

Note: backend/ and frontend/ are specified in README; if absent locally, create them following this structure.

---

## 🔧 Technology Stack

- Language: TypeScript/JavaScript (per README)
- Backend: Node.js + Express, Drizzle ORM, PostgreSQL, Better Auth, Autumn, AI SDK
- Frontend: React 18 (Vite), React Router, TanStack Query, Tailwind CSS, Axios

Versions are not listed in the accessible files; consult `backend/package.json` and `frontend/package.json` when available.

---

## 🌐 External Dependencies

- PostgreSQL – primary data store
- Autumn – billing/credits
- AI providers via AI SDK – LLM interactions
- Better Auth – authentication/session handling

---

### Environment Variables

From README examples:

```bash
# Backend
DATABASE_URL=
BETTER_AUTH_SECRET=
AUTUMN_SECRET_KEY=
FRONTEND_URL=
PORT=5000

# Frontend
VITE_API_URL=
```

---

## 🔄 Common Workflows

- Local backend: `cd backend && npm run dev`
- Local frontend: `cd frontend && npm run dev`
- DB: `cd backend && npm run db:generate && npm run db:push && npm run db:studio`

---

## 📈 Performance & Scale

No specific performance notes found in files. Use React Query caching on the frontend; consider DB indexing for frequent queries on the backend.

---

## 🚨 Things to Be Careful About

- Security: Keep secrets in `.env.local`; do not commit. Ensure auth middleware protects sensitive routes.
- Data: Validate inputs in controllers/services; use parameterized queries via Drizzle.
- Migration: Codebase shows legacy Next.js artifacts. Avoid mixing new backend/frontend with old Next.js runtime paths.


Updated at: 2025-10-12
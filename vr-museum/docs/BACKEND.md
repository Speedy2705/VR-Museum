# Backend Architecture

The backend lives inside the Next.js application and uses App Router Route
Handlers as its HTTP API. There is no separate API server.

## Request flow

```text
src/app/api/**/route.ts
        ↓
src/server/services/*.service.ts
        ↓
src/lib/prisma.ts
        ↓
Prisma Client → database
```

- **Routes** translate HTTP input and output. Keep them thin: parse the request,
  validate input with Zod, call one service, and return a standardized response.
- **Services** contain business rules and coordinate database operations. They
  must not depend on UI components or route-specific response objects.
- **Prisma** is exposed through the singleton in `src/lib/prisma.ts`. Do not
  create additional `PrismaClient` instances.
- **Validators** live in `src/lib/validators/` and are shared by routes and
  services where boundary validation is required.
- **Responses** use `apiSuccess` and `apiError` from
  `src/lib/api-response.ts`.
- **Logging** uses the server-only utility in `src/lib/logger.ts`.

## Database environments

Local development uses SQLite with `DATABASE_URL="file:./dev.db"`. Prisma 7
uses the official `@prisma/adapter-better-sqlite3` driver adapter at runtime.
The local database file and all `.env` files are ignored by Git.

Production will use PostgreSQL. Before the production deployment batch:

1. Change the Prisma datasource provider to `postgresql`.
2. Install and configure `@prisma/adapter-pg` in the Prisma singleton.
3. Point `DATABASE_URL` at the production PostgreSQL instance.
4. Generate and apply a PostgreSQL migration history.

SQLite and PostgreSQL migration histories should not be mixed.

## Authentication

`src/lib/auth.ts` is reserved for the future Auth.js configuration and
server-side session helpers. `NEXTAUTH_SECRET` is documented now, but
authentication is not enabled in this batch.
# Upload and moderation flow

Uploads have two media branches. Video scans accept MP4, MOV, or WebM and proceed from domain selection directly to artifact details. 3D uploads accept GLB, glTF, OBJ, or STL and open in an interactive lighting studio. Colour temperature and light direction are stored independently: Warm White (3000 K), Cool White (4000 K), or Artificial Daylight (5000 K) can be combined with Spotlight, Top Light, Front-Facing Light, Raking Light, or Backlight. Each domain suggests its requested temperature while contributors retain control. Curators can preview every temperature-and-direction combination before deciding.

Moderation has two negative outcomes. `CHANGES_REQUESTED` is actionable: the curator comment is shown to the artist, who may edit metadata, replace the media or display photo, change 3D lighting, and resubmit; saving returns the upload to `PENDING`. `REJECTED` is terminal: its curator comment remains visible, but editing is hidden in the UI and rejected updates are rejected by the service/API. Approval publishes the upload into its selected domain and the Community Uploads discovery feed; selecting Community Uploads places it only in that community destination.

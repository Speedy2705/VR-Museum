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

All environments use PostgreSQL through Prisma's `@prisma/adapter-pg` adapter.
Production should use a pooled serverless connection string in `DATABASE_URL`.
The active PostgreSQL migration history is in `prisma/migrations`; the retired
local SQLite history is retained in `prisma/migrations-sqlite-archive` only for
reference and must not be deployed.

Uploads use local disk when `BLOB_READ_WRITE_TOKEN` is absent. Vercel
deployments set that token through a connected Blob store and enable direct
browser uploads with `NEXT_PUBLIC_BLOB_UPLOADS=true`, avoiding the Vercel
Function request-body limit for large model and video files.

Meshy three-view generation is the exception to the local-disk fallback:
Meshy's Multi-Image API requires public JPG/PNG URLs, so
`MESHY_API_KEY` and `BLOB_READ_WRITE_TOKEN` must both be configured. The service
records source Blob URLs by Meshy task ID and removes them after a terminal
task status.

## Authentication

`src/lib/auth.ts` is reserved for the future Auth.js configuration and
server-side session helpers. `NEXTAUTH_SECRET` is documented now, but
authentication is not enabled in this batch.
# Upload and moderation flow

Uploads have two media branches. Video scans accept MP4, MOV, or WebM and proceed from domain selection directly to artifact details. 3D uploads accept GLB, glTF, OBJ, or STL and open in an interactive lighting studio. Colour temperature and light direction are stored independently: Warm White (3000 K), Cool White (4000 K), or Artificial Daylight (5000 K) can be combined with Spotlight, Top Light, Front-Facing Light, Raking Light, or Backlight. Each domain suggests its requested temperature while contributors retain control. Curators can preview every temperature-and-direction combination before deciding.

Moderation has two negative outcomes. `CHANGES_REQUESTED` is actionable: the curator comment is shown to the artist, who may edit metadata, replace the media or display photo, change 3D lighting, and resubmit; saving returns the upload to `PENDING`. `REJECTED` is terminal: its curator comment remains visible, but editing is hidden in the UI and rejected updates are rejected by the service/API. Approval publishes the upload into its selected domain and the Community Uploads discovery feed; selecting Community Uploads places it only in that community destination.

<div align="center">
  <img src="vr-museum/public/brand/viswaroop-logo-dark.svg" alt="ViswaRoop" width="360" />

  # Explore. Experience. Own History.

  **A multilingual virtual museum where cultural heritage can be explored, studied, contributed, curated, and collected.**

  [![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs)](https://nextjs.org/)
  [![React](https://img.shields.io/badge/React-19-149ECA?logo=react)](https://react.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
  [![Tests](https://img.shields.io/badge/Vitest-53%20passing-6E9F18?logo=vitest&logoColor=white)](vr-museum/docs/TESTING.md)
  [![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?logo=vercel)](https://viswaroop.iiitdmj.ac.in)

  ### [Enter the live museum →](https://viswaroop.iiitdmj.ac.in)

  [Discover the experience](#-step-inside) · [Explore the features](#-what-you-can-do) · [Run locally](#-bring-the-museum-to-life) · [Read the docs](#-project-guidebook)
</div>

---

## ✦ The museum without walls

**ViswaRoop** reimagines a museum as a living digital space. Visitors can move through themed collections, inspect artifacts through images, video, and interactive 3D, enter a browser-based virtual gallery, and acquire licensed digital works from independent contributors.

It is also a platform for preservation and participation. Artists and archaeologists can contribute their own scans or models, curators can review every submission, and researchers can build a personal library of purchased artifacts. With 16 supported languages and right-to-left layouts, the experience is designed to make culture feel closer—wherever the visitor happens to be.

ViswaRoop is deployed on **Vercel** and is presently active at **[viswaroop.iiitdmj.ac.in](https://viswaroop.iiitdmj.ac.in)**. The production site automatically routes each visit to the appropriate localized experience.

<div align="center">
  <img src="vr-museum/public/images/hero-gallery.png" alt="ViswaRoop virtual museum gallery" width="880" />
</div>

## 🏛 Step inside

The experience is organized around five connected spaces:

| Space | What awaits you |
| --- | --- |
| **Collections** | Wander through curated galleries such as *Veins of Marble*, *Forged in Time*, *Stories in Color*, *Echoes in Stone*, and *Earth & Ember*. |
| **Artifact stories** | Discover each object's period, material, origin, description, creator, license, and high-fidelity media. |
| **Virtual gallery** | Enter an immersive Three.js museum, move through the environment, and inspect exhibition plaques and 3D artifacts. |
| **Marketplace** | Search and filter licensed digital artifacts, add them to a persistent cart, and complete secure card or UPI checkout. |
| **Community** | Meet contributors, view approved uploads, report concerns, and see heritage expand beyond the permanent collection. |

## ✨ What you can do

### Explore every detail

- Browse six themed collection areas and discover artifacts by category.
- Experience photographs, video exhibits, and interactive 3D models powered by `<model-viewer>` and Three.js.
- Open media in fullscreen and study objects under museum-inspired lighting presets, including raking light, spotlight, backlight, and artificial daylight.
- Visit an immersive virtual exhibition directly in the browser.

### Travel across languages

- Switch between **English, Hindi, Marathi, Bengali, Tamil, Telugu, Gujarati, Punjabi, Urdu, Spanish, French, German, Arabic, Chinese, Japanese, and Korean**.
- Navigate naturally with right-to-left layouts for Arabic and Urdu.
- Keep a preferred language across sessions while durable PostgreSQL caching avoids unnecessary translation calls.
- Fall back gracefully to English if the translation provider is unavailable.

### Collect digital heritage

- Search and filter marketplace listings by artifact, material, or collection.
- Maintain a persistent cart and review a clear order summary.
- Pay using **Stripe cards** or **Razorpay UPI** in configured environments.
- Access purchases, order history, billing details, and uploaded work from a personal asset library.
- Rely on signed, idempotent webhooks for authoritative payment fulfillment.

### Contribute to the collection

- Upload a display image with a 3D model (`GLB`, `glTF`, `OBJ`, or `STL`) or video (`MP4`, `MOV`, or `WebM`).
- Create a 3D model from three reference photographs through the optional Meshy workflow.
- Add historical context, material, origin, license, and pricing information in a guided upload wizard.
- Track review status, respond to curator feedback, and manage owned listings.

### Curate with confidence

- Review submissions in a dedicated moderation queue.
- Approve, reject, or request changes with a curator comment.
- Triage artifact reports and support requests.
- Enforce ownership and permissions at both the interface and server boundaries.

## 🧭 How to experience ViswaRoop

### As a visitor or researcher

1. Open **Collections** and choose a gallery that catches your eye.
2. Select an artifact to read its story and explore its available media.
3. Enter **VR** for the spatial museum experience.
4. Browse the **Marketplace**, add licensed works to your cart, and check out.
5. Find completed purchases and order history under **Your Assets**.

### As an artist or archaeologist

1. Create an account and select the appropriate contributor role.
2. Open **Upload Artifact** and choose an existing model/video or the three-image Meshy workflow.
3. Complete the artifact story, media, license, and listing details.
4. Submit it for review and follow its status from **Your Assets**.
5. Once approved, the contribution becomes discoverable in the community collection.

### As a curator

1. Open the **Moderation** workspace.
2. Inspect the submission, its metadata, media, and contributor details.
3. Approve it, reject it, or request a focused revision.
4. Review reported artifacts and respond to incoming support requests from the same workspace.

## 🎭 A role for every kind of explorer

| Capability | Visitor | Researcher | Archaeologist | Artist | Curator |
| --- | :---: | :---: | :---: | :---: | :---: |
| Browse collections, VR, and marketplace | ✓ | ✓ | ✓ | ✓ | ✓ |
| Cart, checkout, purchases, and orders | ✓ | ✓ | ✓ | ✓ | ✓ |
| Upload and manage personal artifacts | — | — | ✓ | ✓ | ✓ |
| List and manage personal marketplace items | — | — | ✓ | ✓ | ✓ |
| Moderate all community submissions | — | — | — | — | ✓ |

> Authentication is not the authorization boundary. Sensitive actions are checked again in server services and API route handlers, and marketplace changes remain owner-scoped.

## 🧬 Built with

| Layer | Technology | Purpose |
| --- | --- | --- |
| **Experience** | Next.js 16 App Router, React 19, TypeScript 5 | Server-rendered pages, interactive interfaces, and route handlers |
| **Visual system** | Tailwind CSS 4, Motion, Sonner | Responsive styling, transitions, feedback, and micro-interactions |
| **3D & media** | Three.js, Google `<model-viewer>` | Virtual galleries, model inspection, lighting, image, and video presentation |
| **Identity** | Auth.js 5, Prisma adapter, bcryptjs | Credentials, Google/Apple OAuth, sessions, profiles, and roles |
| **Data** | PostgreSQL, Prisma 7, Zod 4 | Relational persistence, migrations, typed queries, and validation |
| **Commerce** | Stripe, Razorpay | Card and UPI payment flows with signed webhook fulfillment |
| **Storage & AI** | Vercel Blob, Meshy, Gemini | Direct media uploads, image-to-3D generation, and cached multilingual translation |
| **Quality** | Vitest, Playwright, ESLint, Lighthouse | Tests, browser audits, linting, and performance checks |
| **Deployment** | Vercel | Serverless application hosting, builds, and Blob integration |

### Live deployment

| Environment | Platform | Address |
| --- | --- | --- |
| **Production** | Vercel | [viswaroop.iiitdmj.ac.in](https://viswaroop.iiitdmj.ac.in) |

### How the pieces connect

```text
Visitor / Contributor / Curator
              │
              ▼
     Next.js + React interface
              │
              ▼
      App Router API handlers
              │
      Zod validation + Auth.js
              │
              ▼
        Domain service layer
              │
       Prisma ───── PostgreSQL
              │
              ├── Vercel Blob / local development storage
              ├── Stripe + Razorpay
              ├── Gemini translations
              └── Meshy image-to-3D
```

## 🚀 Bring the museum to life

The application lives in [`vr-museum`](vr-museum). Run all project commands from that directory.

### Prerequisites

- [Node.js](https://nodejs.org/) 20 or newer
- npm
- A PostgreSQL database
- Optional provider accounts for OAuth, payments, Blob storage, translation, and image-to-3D generation

### 1. Install the project

```bash
git clone https://github.com/Speedy2705/VR-Museum.git
cd VR-Museum/vr-museum
npm install
```

### 2. Create your environment file

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

At minimum, configure these values:

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"
AUTH_SECRET="generate-a-long-random-secret"
NEXTAUTH_SECRET="use-the-same-long-random-secret"
AUTH_URL="http://localhost:3000"
```

The complete [`.env.example`](vr-museum/.env.example) documents every optional integration:

| Experience | Variables |
| --- | --- |
| Google / Apple sign-in | `AUTH_GOOGLE_*`, `AUTH_APPLE_*` |
| Durable media uploads | `BLOB_READ_WRITE_TOKEN`, `NEXT_PUBLIC_BLOB_UPLOADS` |
| Stripe cards | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| Razorpay UPI | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` |
| Multilingual translation | `GEMINI_API_KEY`, `GEMINI_TRANSLATION_MODEL` |
| Three-image-to-3D | `MESHY_API_KEY` plus public Vercel Blob storage |

> Keep secret values server-side and never add a `NEXT_PUBLIC_` prefix unless the variable is explicitly designed for browser access.

### 3. Prepare the database

```bash
npm run prisma:generate
npx prisma migrate deploy
npm run prisma:seed
```

The seed creates the initial collections, artifacts, marketplace listings, community uploads, and demo identities.

### 4. Open the doors

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000). The locale proxy will guide the request to a localized route such as `/en`.

## 🛠 Curator's toolkit

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the local development server |
| `npm run build` | Generates Prisma Client and creates a production build |
| `npm start` | Serves the production build |
| `npm test` | Runs the Vitest suite once |
| `npm run test:watch` | Runs tests continuously while developing |
| `npm run lint` | Checks the codebase with ESLint |
| `npx tsc --noEmit` | Type-checks without writing output |
| `npm run prisma:studio` | Opens a visual editor for the database |
| `npm run prisma:seed` | Populates the museum catalog |
| `npm run seed:audit` | Audits source catalog data for completeness |

The latest documented deterministic run reports **53 passing tests across 9 files**, plus passing ESLint and TypeScript checks. See the [testing guide](vr-museum/docs/TESTING.md) for browser scripts and credential-backed release checks.

## 🗺 Repository map

```text
VR-Museum/
├── README.md                  # You are here
└── vr-museum/
    ├── prisma/                # PostgreSQL schema and migration history
    ├── public/                # Brand, artifact, gallery, video, and model assets
    ├── scripts/               # Smoke, browser, role, media, and seed audits
    ├── src/
    │   ├── app/               # Pages, layouts, and HTTP route handlers
    │   ├── components/        # Museum UI, commerce, media, and moderation
    │   ├── data/              # Curated source catalog
    │   ├── lib/               # Auth, i18n, validation, Prisma, policies, and 3D tools
    │   └── server/            # Domain services and storage providers
    └── docs/                  # Engineering and operations guides
```

## 📚 Project guidebook

| Guide | Subject |
| --- | --- |
| [API reference](vr-museum/docs/API.md) | Endpoints, authentication, payloads, and errors |
| [Authentication](vr-museum/docs/AUTH.md) | Credentials, OAuth, callbacks, and account linking |
| [Backend architecture](vr-museum/docs/BACKEND.md) | Services, persistence, storage, and operational limits |
| [Roles and permissions](vr-museum/docs/ROLES.md) | Complete authorization matrix |
| [Payments](vr-museum/docs/PAYMENTS.md) | Stripe and Razorpay setup and webhook flows |
| [Translations](vr-museum/docs/TRANSLATIONS.md) | Locales, Gemini translation, caching, and fallback |
| [Testing](vr-museum/docs/TESTING.md) | Deterministic checks, browser audits, and provider verification |
| [Deployment](vr-museum/docs/DEPLOYMENT.md) | Vercel, infrastructure, callbacks, and releases |
| [Final QA](vr-museum/docs/FINAL_QA.md) | Functional, multilingual, accessibility, and release checks |
| [UI audit](vr-museum/docs/UI-AUDIT.md) | Responsive, accessibility, content, and metadata review |

## ⚠️ Before opening to the public

- Production builds deploy migrations but intentionally do **not** seed the database. Seed a new environment once from a trusted machine.
- Payment success is confirmed only by a valid provider webhook—not by the browser success screen.
- The built-in rate limiter is process-local; use a shared store before scaling to multiple application instances.
- Local-disk uploads are a development fallback. Use Vercel Blob or another durable object store in production.
- Meshy generation needs exactly three JPG/PNG source views, a `MESHY_API_KEY`, and publicly accessible Blob URLs.
- Uploaded 3D models are limited to **150 MB** and videos to **200 MB**.
- Use provider test credentials until OAuth callbacks, payment webhooks, storage, translations, and generation have been verified on the deployed domain.

---

<div align="center">
  <img src="vr-museum/public/brand/viswaroop-mark.svg" alt="ViswaRoop mark" width="72" />

  **History should not feel distant. Step closer.**

  Built to preserve stories, empower creators, and make cultural discovery borderless.
</div>

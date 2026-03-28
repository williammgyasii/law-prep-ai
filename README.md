# LawPrep AI — Personal LSAT Study Organizer

A polished web app that helps organize LSAT prep resources into a clean, guided, Udemy-like learning experience with AI-powered study assistance.

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS v4**
- **shadcn/ui** (radix-nova style)
- **Drizzle ORM** + **Neon** PostgreSQL (serverless)
- **OpenAI API** (optional — works with mock responses)
- **Zod** for validation
- **Lucide React** for icons

## Getting Started

### Prerequisites

- Node.js 18+
- A Neon database (or any PostgreSQL)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` or create `.env` with:

```
DATABASE_URL='postgresql://user:password@host/dbname?sslmode=require'
# OPENAI_API_KEY="sk-..."  (optional)
```

### 3. Push schema to database

```bash
npm run db:push
```

### 4. Seed the database

```bash
npm run db:seed
```

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to the dashboard.

## AI Features (Optional)

Add your OpenAI API key to `.env` to enable real AI responses:

```
OPENAI_API_KEY="sk-..."
```

Without the key, the app uses realistic mock responses so all features remain functional.

### AI Tools

- **Summarize Notes** — Condenses study notes into key takeaways
- **Explain Simply** — Explains concepts in plain English with analogies
- **Generate Quiz** — Creates practice questions from notes and topic
- **Suggest Next Lesson** — Recommends what to study next based on progress
- **Generate Study Plan** — Creates a personalized weekly study schedule

## Project Structure

```
├── app/
│   ├── (app)/              # App routes with sidebar layout
│   │   ├── dashboard/      # Main dashboard
│   │   ├── modules/        # Module list + detail pages
│   │   ├── resources/      # Resource detail pages
│   │   ├── planner/        # AI study planner
│   │   ├── weak-areas/     # Weak area tracker
│   │   ├── admin/          # Content management
│   │   └── settings/       # App settings
│   ├── layout.tsx          # Root layout
│   └── globals.css         # Tailwind + design tokens
├── actions/                # Server actions (CRUD + AI)
├── components/
│   ├── ui/                 # shadcn/ui primitives
│   └── admin/              # Admin-specific components
├── db/
│   ├── index.ts            # Drizzle client (Neon serverless)
│   ├── schema.ts           # Database schema
│   └── seed.ts             # Sample data seeder
├── lib/                    # Utilities, OpenAI, constants, validations
└── drizzle.config.ts       # Drizzle Kit config
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run db:push` | Push schema to database |
| `npm run db:generate` | Generate migration files |
| `npm run db:migrate` | Run migrations |
| `npm run db:seed` | Seed sample data |
| `npm run db:studio` | Open Drizzle Studio |

## Legal Notice

This app does **not** scrape, copy, download, or rehost copyrighted LawHub/LSAC content. It is a personal study organizer that supports:

- Manual entry of resource metadata (titles, URLs, descriptions)
- Personal study notes
- Organization into modules
- AI assistance using only user-authored content and metadata

All AI-generated content is clearly labeled as AI-generated study support.

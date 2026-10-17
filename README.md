# AI-Based ATS-Friendly Resume Builder

An AI-powered resume builder that helps users create, customize, analyze, and tailor resumes for specific job opportunities. The application combines a structured resume editor with AI-assisted writing, ATS scoring, job-description matching, resume analysis, and document export.

## Overview

Creating a resume that is readable, relevant, and compatible with Applicant Tracking Systems (ATS) can be time-consuming. This project brings resume creation and AI-assisted career tools into a single web application.

Users can manage multiple resumes, edit individual sections, adjust visual styling, analyze resume quality, match their resumes against job descriptions, generate cover letters, and export their work into commonly used document formats.

## Features

### Resume Management
- Create and edit resumes using a structured editor.
- Manage resume sections and their content.
- Customize resume styling, including template selection, accent color, font family, and font size.
- Duplicate existing resumes.
- Save and restore previous resume versions.
- Share resumes through public links.

### AI-Powered Career Tools
- **ATS scoring:** Evaluate resumes using an AI-assisted scoring workflow.
- **Resume analysis:** Identify strengths, weaknesses, and areas for improvement.
- **AI rewriting:** Improve the wording of resume content.
- **Professional summaries:** Generate AI-assisted resume summaries.
- **Job matching:** Compare a resume with a job description and identify matched and missing keywords.
- **Career recommendations:** Receive AI-generated career-related suggestions.
- **Cover letter generation:** Generate cover letters with configurable tone.
- **Resume-aware chat:** Interact with an AI assistant for resume-related guidance.
- **Resume import:** Import PDF or DOCX content through an AI-assisted extraction workflow.

AI results depend on the configured provider, model availability, API limits, and the quality of the supplied information. ATS scores are estimates, not guarantees of passing an employer's screening process.

### Export and Preview
- Export resumes as PDF, DOCX, and HTML.
- Preview resumes before sharing or exporting.
- Provide read-only public resume previews for shared resumes.

### Authentication and Administration
- Register and log in using the application's authentication system.
- Manage resumes associated with an account.
- Access administrative pages for user management and statistics.
- Submit feedback, bug reports, and feature requests.

Administrative access and permissions depend on the application's configured authorization rules.

## Technology Stack

| Technology | Purpose |
|---|---|
| Next.js 14 | Application framework and routing |
| React 18 | User interface |
| TypeScript | Type-safe application development |
| Tailwind CSS | Styling |
| Prisma ORM | Database access and schema management |
| PostgreSQL | Relational database |
| NextAuth.js | Authentication and session management |
| Google Gemini API | AI-powered features |
| Groq API | Alternative AI provider |
| Anthropic API | Alternative AI provider |
| `@react-pdf/renderer` | PDF generation |
| `docx` | Word document generation |
| `mammoth` | DOCX content extraction |
| `pdf-parse` | PDF text extraction |
| Zod | Data validation |
| `react-hot-toast` | UI notifications |

The AI integration is configurable through environment variables, allowing the application to use one of the supported AI providers.

## Architecture

The project uses the Next.js App Router, with frontend pages and API endpoints maintained in the same application.

- **Frontend:** React components and Next.js pages handle the dashboard, resume editor, previews, and administrative interface.
- **API layer:** Route handlers implement authentication, resume operations, AI requests, imports, exports, sharing, and feedback.
- **Business logic:** Shared utilities manage AI provider integration, prompts, authentication, resume sections, and templates.
- **Database:** Prisma models represent users, resumes, resume versions, job descriptions, job matches, analyses, cover letters, templates, and feedback.

Resume section content is stored in the `sectionsJson` field. This allows sections to be represented as structured JSON without requiring a separate database table for every section type.

## Project Structure

```text
resume-builder/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── admin/
│   ├── api/
│   │   ├── admin/
│   │   ├── ai/
│   │   │   ├── ats-score/
│   │   │   ├── career-recommendations/
│   │   │   ├── chat/
│   │   │   ├── cover-letter/
│   │   │   ├── job-match/
│   │   │   ├── resume-analysis/
│   │   │   ├── rewrite/
│   │   │   └── summary/
│   │   ├── auth/
│   │   ├── cover-letters/
│   │   ├── feedback/
│   │   ├── import/
│   │   ├── public/
│   │   └── resumes/
│   ├── builder/
│   ├── dashboard/
│   ├── preview/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   └── providers.tsx
├── components/
│   ├── ai/
│   ├── resume/
│   ├── templates/
│   └── ui/
├── lib/
│   ├── ai.ts
│   ├── auth.ts
│   ├── prisma.ts
│   ├── prompts.ts
│   ├── resumeSections.ts
│   ├── resumeText.ts
│   ├── session.ts
│   └── templates.ts
├── prisma/
│   ├── migrations/
│   ├── migrations-sqlite-backup/
│   ├── schema.prisma
│   └── seed.ts
├── types/
│   ├── next-auth.d.ts
│   └── resume.ts
├── .env.example
├── package.json
└── README.md
```

## Prerequisites

Before running the application, install:

- Node.js and npm.
- A PostgreSQL database.
- An API key for one supported AI provider.
- Git, if cloning the repository.

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/AarizKadri/AI-Based-ATS-Friendly-Resume-Builder.git
cd AI-Based-ATS-Friendly-Resume-Builder
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root using `.env.example` as a reference.

```env
DATABASE_URL="your-postgresql-connection-url"
DIRECT_URL="your-direct-postgresql-connection-url"

NEXTAUTH_SECRET="your-long-random-secret"
NEXTAUTH_URL="http://localhost:3000"

AI_PROVIDER="gemini"

GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-2.5-flash"

GROQ_API_KEY=""
GROQ_MODEL="llama-3.3-70b-versatile"

ANTHROPIC_API_KEY=""
ANTHROPIC_MODEL="claude-sonnet-4-5"
```

Replace the example values with your actual configuration.

- `DATABASE_URL` is the PostgreSQL connection string used by Prisma.
- `DIRECT_URL` is the direct database connection string configured in the Prisma schema. Supply it when required by your database provider and deployment configuration.
- `NEXTAUTH_SECRET` is used to secure authentication-related tokens and sessions.
- `NEXTAUTH_URL` identifies the application URL.
- `AI_PROVIDER` selects the AI provider.
- The API key and model variables configure the selected provider.

Keep `.env` out of version control. Never commit database credentials, authentication secrets, or API keys.

### 4. Configure the database

The current Prisma schema uses PostgreSQL. Create a PostgreSQL database and configure the connection strings before running migrations.

Generate the Prisma client:

```bash
npm run prisma:generate
```

Apply the existing database migrations:

```bash
npx prisma migrate deploy
```

For a new local development migration after making schema changes, use:

```bash
npm run prisma:migrate
```

The project also contains a SQLite migration backup, but the current schema is configured for PostgreSQL. Do not assume the SQLite backup or `prisma/dev.db` is the active database configuration.

### 5. Seed the database

```bash
npm run db:seed
```

Review `prisma/seed.ts` before relying on any seeded accounts or default credentials. Change any development-only credentials before using a deployed instance.

### 6. Start the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Register an account and explore the available resume-building features.

## Choosing an AI Provider

Set `AI_PROVIDER` in `.env` to one of the supported values.

| Provider | Configuration | Notes |
|---|---|---|
| Google Gemini | `AI_PROVIDER="gemini"` | Requires a Gemini API key |
| Groq | `AI_PROVIDER="groq"` | Requires a Groq API key |
| Anthropic | `AI_PROVIDER="anthropic"` | Requires an Anthropic API key |

Obtain API keys from the providers' official websites:

- Google AI Studio: https://aistudio.google.com/apikey
- Groq Console: https://console.groq.com/keys
- Anthropic Console: https://console.anthropic.com/

Configure the model name and API key for the selected provider. API access, usage limits, pricing, and model availability are determined by the provider and may change.

## Available Commands

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Generate the Prisma client and build the application |
| `npm run start` | Start the production server after building |
| `npm run lint` | Run the configured Next.js lint command |
| `npm run prisma:generate` | Generate the Prisma client |
| `npm run prisma:migrate` | Run Prisma development migrations |
| `npm run db:seed` | Execute the database seed script |

## Database Models

The Prisma schema defines the following main models:

- **User:** Account details, profile information, and relationships to resumes, cover letters, and feedback.
- **Resume:** Resume metadata, styling, structured sections, sharing settings, and job-tailoring information.
- **ResumeVersion:** Stored resume snapshots for version history and restoration.
- **JobDescription:** Job descriptions used for tailoring and matching.
- **JobMatch:** Match scores, keyword results, and recommendations.
- **ResumeAnalysis:** Overall and ATS scores, section scores, strengths, weaknesses, and recommendations.
- **CoverLetter:** Cover-letter content, tone, company, and ownership information.
- **Template:** Template metadata and availability.
- **Feedback:** User-submitted feedback and its status.

## Deployment

The application can be deployed to a compatible Next.js hosting platform, such as Vercel, provided the database and AI integrations are configured correctly.

Before deploying:

1. Provision a PostgreSQL database.
2. Configure `DATABASE_URL` and `DIRECT_URL` in the deployment environment.
3. Set `NEXTAUTH_SECRET` and the production `NEXTAUTH_URL`.
4. Configure the selected AI provider and its API key.
5. Apply the database migrations.
6. Build and test the deployed application.
7. Verify authentication, resume persistence, AI tools, sharing, and exports.

Use the production domain for `NEXTAUTH_URL` in the deployed environment. Do not use a local SQLite file as the persistent database for a typical serverless deployment.

## Security and Privacy

- Store secrets in environment variables rather than source code.
- Use HTTPS in production.
- Review authorization checks on resume, user, and administrative endpoints.
- Avoid sending sensitive personal information in test resumes when using third-party AI services.
- Review the selected AI provider's data handling and retention policies before processing real user information.

## Limitations

- AI-generated content may require manual editing and fact-checking.
- ATS scoring is an estimate and does not guarantee selection by a recruiter or ATS.
- AI functionality depends on valid provider credentials and available API capacity.

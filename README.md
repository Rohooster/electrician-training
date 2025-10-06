# California Electrician Exam Prep

Production-quality exam preparation platform for California General Electrician (Journeyman) certification exam.

## Features

- **Exam Simulator**: PSI-style practice exams with 100 questions, 4-hour time limit, open-book simulation
- **NEC Navigator Trainer**: Timed code lookup drills to master the NEC Index, Articles, and Tables
- **Calculation Generator**: Parametric electrical calculations with step-by-step solutions and NEC citations
- **Analytics Dashboard**: IRT-lite ability estimation, topic mastery tracking, and weak area identification
- **Content Admin**: Item bank management, bulk import/export, and jurisdiction configuration

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **API**: tRPC for type-safe API calls
- **Auth**: Auth.js (NextAuth.js v5)
- **Styling**: Tailwind CSS
- **Testing**: Playwright

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- pnpm (recommended) or npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/rohooster/electrician-tool.git
cd electrician-tool
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your database credentials:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/electrician_prep"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

4. Set up the database:
```bash
pnpm db:push
```

5. Seed California jurisdiction data:
```bash
pnpm seed:ca
```

This creates:
- CA General Electrician jurisdiction
- CEC 2022 (NEC 2020) code edition
- PSI exam rules (100 questions, 240 min, 70% pass)
- 150+ sample exam items across all topics
- 3 calculation templates

6. Run the development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed-ca.ts             # CA jurisdiction seeder
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── api/trpc/          # tRPC API endpoint
│   │   ├── exam/              # Exam simulator pages
│   │   ├── trainer/           # NEC Navigator pages
│   │   ├── calc/              # Calculation practice pages
│   │   ├── analytics/         # Analytics dashboard
│   │   └── admin/             # Admin panel
│   ├── components/            # React components
│   ├── jurisdictions/         # Jurisdiction configs
│   │   └── ca.ts              # CA-specific constants
│   ├── lib/                   # Utilities
│   │   ├── prisma.ts          # Prisma client
│   │   ├── auth.ts            # Auth.js config
│   │   ├── exam/              # Exam logic
│   │   ├── trainer/           # Drill generation
│   │   └── calc/              # Calculation engine
│   └── server/                # tRPC backend
│       ├── trpc.ts            # tRPC setup
│       └── routers/           # API routers
│           ├── exam.ts        # Exam procedures
│           ├── trainer.ts     # Trainer procedures
│           ├── calc.ts        # Calc procedures
│           └── admin.ts       # Admin procedures
├── docs/                      # Documentation
│   ├── CA_README.md           # CA configuration guide
│   └── content-model.md       # Content model docs
└── tests/                     # Playwright tests
```

## Jurisdiction Configuration

The app uses a multi-jurisdiction architecture. California is the first implementation.

### CA General Electrician Configuration

- **Code Edition**: CEC 2022 (NEC 2020 base)
- **Exam Vendor**: PSI
- **Questions**: 100
- **Time Limit**: 240 minutes (4 hours)
- **Pass Threshold**: 70%
- **Allowed Materials**: NEC 2020, CEC 2022, basic/scientific calculator
- **Retake Policy**: 14-day wait between attempts

All CA-specific constants are isolated in `src/jurisdictions/ca.ts`.

## Content Model

### Items (Questions)

Each exam item includes:
- **Stem**: Question text
- **Options**: A, B, C, D
- **Correct Answer**: Single letter
- **Topic**: Blueprint category (conductor_sizing, grounding_bonding, etc.)
- **Cognitive Type**: LOOKUP, CALC, or THEORY
- **Difficulty**: EASY, MEDIUM, HARD
- **NEC References**: Article/table citations
- **IRT Parameters**: For adaptive testing (a, b, c)

### Blueprint Weights

Blueprint weights define content distribution:
- Definitions & General: 10%
- Branch/Feeder/Service: 12%
- Conductor Sizing: 18%
- OCPD: 12%
- Grounding & Bonding: 15%
- Motors & Transformers: 10%
- Boxes & Enclosures: 8%
- Raceway Fill: 8%
- Special Occupancies: 5%
- Calculations: 12%

## API Overview

### tRPC Routers

**exam**: Build forms, start sittings, submit responses, calculate scores
```typescript
exam.buildForm({ jurisdictionId, targetDifficulty })
exam.start({ examFormId })
exam.submitResponse({ sittingId, itemId, selectedAnswer })
exam.submit({ sittingId })
```

**trainer**: Generate drills, submit navigation paths, track performance
```typescript
trainer.nextDrill({ jurisdictionId, drillType })
trainer.submitDrill({ drillId, navigationPath, foundArticle })
```

**calc**: Generate calculations, validate answers
```typescript
calc.generate({ templateId, seed })
calc.validate({ templateId, seed, userAnswer })
```

**admin**: Import items, bulk retag, update rules
```typescript
admin.importItems({ jurisdictionId, items })
admin.updateRules({ ruleSetId, data })
```

## Testing

Run Playwright tests:
```bash
pnpm test:e2e
```

Test coverage includes:
- Full exam flow (start → answer → submit)
- Code panel lookup tracking
- Calculation generation correctness
- Drill navigation grading

## Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm db:push` - Push Prisma schema to database
- `pnpm db:studio` - Open Prisma Studio
- `pnpm seed:ca` - Seed CA jurisdiction
- `pnpm test:e2e` - Run Playwright tests

## Adding New Jurisdictions

1. Create jurisdiction config file in `src/jurisdictions/`
2. Define blueprint weights, rules, and code edition
3. Create seed script in `prisma/seed-{jurisdiction}.ts`
4. Add seeder script to `package.json`
5. Run seeder to populate database

## License

MIT

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## Support

- Documentation: [/docs](/docs)
- Issues: [GitHub Issues](https://github.com/rohooster/electrician-tool/issues)

## Credits

Built with [Next.js](https://nextjs.org), [Prisma](https://prisma.io), [tRPC](https://trpc.io), and [Tailwind CSS](https://tailwindcss.com).

NEC® is a registered trademark of the National Fire Protection Association (NFPA). This software is not affiliated with or endorsed by NFPA.

# Setup Instructions

## Creating the GitHub Repository

Since you want this pushed to your `rohooster` GitHub account, follow these steps:

### Option 1: Using GitHub CLI (if installed)

```bash
gh auth login
gh repo create electrician-tool --public --source=. --remote=origin --push
```

### Option 2: Manual GitHub Creation

1. Go to https://github.com/new
2. Repository name: `electrician-tool`
3. Description: `Production-quality CA Electrician (Journeyman) exam prep platform`
4. Set to **Public**
5. Do NOT initialize with README (we already have one)
6. Click "Create repository"

Then run these commands:

```bash
cd /Users/rohansontakke/Desktop/code/electrician-tool
git remote add origin https://github.com/rohooster/electrician-tool.git
git branch -M main
git push -u origin main
```

## Database Setup

1. Install PostgreSQL if not already installed:
```bash
brew install postgresql@14
brew services start postgresql@14
```

2. Create database:
```bash
createdb electrician_prep
```

3. Copy environment file:
```bash
cp .env.example .env
```

4. Edit `.env` with your database credentials:
```env
DATABASE_URL="postgresql://your_user:your_password@localhost:5432/electrician_prep"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="run: openssl rand -base64 32"
```

5. Push schema to database:
```bash
pnpm db:push
```

6. Seed California jurisdiction:
```bash
pnpm seed:ca
```

## Running the Application

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000

## Verification

After seeding, verify the data:

```bash
pnpm db:studio
```

This opens Prisma Studio at http://localhost:5555

Check that you have:
- 1 Jurisdiction (ca-general-electrician)
- 1 CodeEdition (cec-2022-nec-2020)
- 1 RuleSet (PSI rules)
- 150+ Items
- 3 CalcTemplates

## Next Steps

1. **Install dependencies**: `pnpm install`
2. **Set up database**: Follow Database Setup above
3. **Create GitHub repo**: Follow Option 1 or 2 above
4. **Start development**: `pnpm dev`
5. **Run tests**: `pnpm test:e2e` (after implementing test files)

## Troubleshooting

### Database Connection Issues

If you get connection errors:
- Verify PostgreSQL is running: `brew services list`
- Check DATABASE_URL in `.env`
- Test connection: `psql postgresql://localhost:5432/electrician_prep`

### Seed Script Errors

If seeding fails:
- Ensure database is empty: `pnpm db:push --force-reset`
- Check Prisma schema is synced: `pnpm db:push`
- Re-run seed: `pnpm seed:ca`

### Build Errors

If build fails:
- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && pnpm install`
- Check Node version: `node -v` (requires 18+)

## Repository Structure

```
electrician-tool/
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed-ca.ts          # CA jurisdiction seeder
├── src/
│   ├── app/                # Next.js pages
│   ├── components/         # React components (to be added)
│   ├── jurisdictions/      # Jurisdiction configs
│   ├── lib/                # Utilities
│   └── server/             # tRPC backend
├── docs/                   # Documentation
├── README.md
└── package.json
```

## Support

- Documentation: See `/docs` folder
- Issues: https://github.com/rohooster/electrician-tool/issues

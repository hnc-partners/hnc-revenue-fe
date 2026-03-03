---
description: Create a new microservice (BE or FE) from template
---

# New Service Skill

Create a new microservice. Supports both backend (BE) and frontend (FE) services.

**IMPORTANT**: This skill dispatches to hnc-devops and hnc-db. When using Task tool for these dispatches, **MUST use `model: "opus"`** (persona dispatch).

## Input Parsing

Parse "$ARGUMENTS" to extract:
- **name**: Service name (required, e.g., "players", "brands-fe")
- **type**: Service type - "be" (backend) or "fe" (frontend)

**Parsing Rules:**
1. If arguments contain "fe" or "-fe" suffix: type = "fe", strip suffix from name
2. If arguments contain explicit "be" or "backend": type = "be"
3. If arguments contain explicit "fe" or "frontend": type = "fe"
4. Default: type = "be" (backend)

**Examples:**
- `/new-service players` → name=players, type=be
- `/new-service players be` → name=players, type=be
- `/new-service brands fe` → name=brands, type=fe
- `/new-service brands-fe` → name=brands, type=fe

---

## Backend (BE) Service Creation

When type = "be":

### Step 1: Copy Template
```bash
cp -r /hnc/backend/services/_template /hnc/backend/services/{name}
rm -rf /hnc/backend/services/{name}/node_modules
rm -rf /hnc/backend/services/{name}/dist
```

### Step 2: Update package.json
Edit `/hnc/backend/services/{name}/package.json`:
- Change `"name": "@hnc-ms/service-template"` to `"name": "@hnc-ms/{name}"`
- Change `"description": "HNC Microservice Template"` to `"description": "HNC {Name} Service"`

### Step 3: Update Config
Edit `/hnc/backend/services/{name}/src/config/index.ts`:
- Change `serviceName: process.env.SERVICE_NAME || 'service-template'` to `serviceName: process.env.SERVICE_NAME || '{name}'`

### Step 4: Allocate Port
Read `/hnc/infra/port-registry.md` to find the next available port.

**Port Ranges:**
- Core APIs: 3000-3049
- Supporting APIs: 3050-3099
- Financial Module: 3100-3199
- Utilities: 5000-5099

Add the new service to the appropriate section with status "Planned".

### Step 5: Generate CLAUDE.md
Create `/hnc/backend/services/{name}/CLAUDE.md` with:

```markdown
# {Name} Service

HNC {Name} microservice.

## Quick Reference

| Aspect | Value |
|--------|-------|
| **Type** | Backend Microservice |
| **Runtime** | Node.js 20 (Debian-slim) |
| **Framework** | Express + TypeScript |
| **Port** | {allocated_port} (internal) |
| **Health** | GET /health |
| **URL** | https://hncms-{name}.scarif-0.duckdns.org |

## Structure

```
src/
├── index.ts           # Entry point
├── api/
│   ├── index.ts       # Router setup
│   └── routes/        # Route handlers
│       └── health.ts  # Health endpoint
├── config/
│   └── index.ts       # Environment config
├── services/          # Business logic
├── repositories/      # Data access
└── types/             # TypeScript types
```

## Commands

```bash
pnpm dev          # Start development server
pnpm build        # Compile TypeScript
pnpm start        # Run production build
pnpm test         # Run tests
pnpm lint         # Lint source code
```

## Database

**Schema**: `{name}` in PostgreSQL `hnc_microservices` database.

See: `/hnc/dev/sidecars/shared/database-architecture.md`

## Docker

Build and run:
```bash
cd /hnc/infra/docker
podman-compose build {name}
podman-compose up -d {name}
```

## Related

- Port Registry: `infrastructure/port-registry.md`
- Docker Patterns: `/hnc/dev/sidecars/hnc-devops/docker-patterns.md`
```

### Step 6: Update Dockerfile Port
Edit `/hnc/backend/services/{name}/Dockerfile`:
- Change `EXPOSE 3000` to `EXPOSE {allocated_port}`
- Change healthcheck URL port to match

### BE Next Steps (Print to User)
```
## Next Steps for {name} Service

1. **Install dependencies:**
   cd /hnc/backend && pnpm install

2. **Add Prisma (if using database):**
   cd services/{name}
   pnpm add @prisma/client
   pnpm add -D prisma
   pnpm prisma init

3. **Create database schema:**
   - Edit prisma/schema.prisma
   - Run: pnpm prisma migrate dev --name init

4. **Add to docker-compose.yml:**
   See: infrastructure/docker/docker-compose.yml
   Template in services/_template/CLAUDE.md

5. **Configure Traefik routing:**
   See: infrastructure/docker/traefik/dynamic/services.yml

6. **Update port registry status:**
   Change status from "Planned" to "Active"

7. **External access (delegate to infra-sage):**
   - Pi-hole DNS entry
   - NPM proxy host

Port allocated: {allocated_port}
URL: https://hncms-{name}.scarif-0.duckdns.org
```

---

## Frontend (FE) Service Creation

When type = "fe":

### Step 1: Clone Template
```bash
cd /workspace
git clone https://github.com/hnc-partners/hnc-frontend-template.git hnc-{name}-fe
cd hnc-{name}-fe
rm -rf .git
git init
```

### Step 2: Update package.json
Edit `/hnc/frontend/{name}/package.json`:
- Change `"name"` to `"@hnc/hnc-{name}-fe"`
- Update `"description"` appropriately

### Step 3: Set Up Command Files
Create `.claude/commands/fe-master.md` pointing to `/hnc/dev/agents/fe-master.md`.
Add handovers symlink: `ln -s /hnc/dev/handovers handovers`

### Step 4: Set Service Accent Color
Use the service color from palette:

**Service Color Palette:**
| Service | Color Name | Hex |
|---------|------------|-----|
| labels | Steel Blue | #456882 |
| brands | Violet | #8b5cf6 |
| contacts | Teal | #14b8a6 |
| deals | Amber | #f59e0b |
| gaming-accounts | Indigo | #6366f1 |
| auth | Steel Blue | #456882 |

If service not in palette, ask user to pick a color or use a default (e.g., Steel Blue).

Edit `/hnc/frontend/{name}/tailwind.config.ts`:
- Add service color to extend.colors section

Edit `/hnc/frontend/{name}/src/index.css` or create CSS variables:
```css
:root {
  --service-accent: {hex_color};
  --service-accent-light: {lighter_variant};
  --service-accent-dark: {darker_variant};
}
```

### Step 5: Generate CLAUDE.md
Create `/hnc/frontend/{name}/CLAUDE.md`:

```markdown
# {Name} Frontend

HNC {Name} micro-frontend application.

## Quick Reference

| Aspect | Value |
|--------|-------|
| **Type** | Frontend (React) |
| **Framework** | React + Vite + TypeScript |
| **Styling** | Tailwind CSS |
| **Accent Color** | {color_name} ({hex_color}) |
| **API Backend** | hncms-{name}.scarif-0.duckdns.org |

## Structure

```
src/
├── App.tsx            # Root component
├── main.tsx           # Entry point
├── components/        # UI components
├── features/          # Feature modules
├── hooks/             # Custom hooks
├── services/          # API services
├── stores/            # State management
└── types/             # TypeScript types
```

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm preview      # Preview production build
pnpm lint         # Lint source code
pnpm test         # Run tests
```

## Dev System Integration

This project uses symlinks to access the HNC development system:
- `.claude/` symlinked for Claude Code commands
- `handovers/` symlinked to `/hnc/dev/handovers/` for Ele's work queue

## Color Theme

Service accent: **{color_name}** (`{hex_color}`)

CSS Variables:
- `--service-accent`: Primary accent
- `--service-accent-light`: Hover states
- `--service-accent-dark`: Active states

## Related

- Backend: `hncms-{name}.scarif-0.duckdns.org`
- FE Patterns: `/hnc/dev/sidecars/hnc-fe/`
```

### Post-Creation: Module Federation Setup

The hnc-frontend-template is barebones. After creation, configure MF:

1. **Install MF dependencies**:
   ```bash
   pnpm add -D @module-federation/vite vite-plugin-css-injected-by-js
   pnpm add @hnc-partners/auth-context
   ```

2. **Update vite.config.ts**: See `new-frontend-guide.md` Step 6 for full configuration:
   - Add federation plugin (production only)
   - Add CSS injection plugin
   - Configure shared deps (react, react-dom, auth-context as singletons)
   - Set production base URL

3. **Update main.tsx**: Add shell detection and conditional AuthProvider (Step 7)

4. **Update index.css**: Add `--mf-accent` CSS variable with service color

5. **Update tailwind.config.js**: Add `mf-accent` color mapping

**Reference**: `/hnc/dev/sidecars/hnc-fe/new-frontend-guide.md` Steps 5-8

### FE Next Steps (Print to User)
```
## Next Steps for {name} Frontend

1. **Install dependencies:**
   cd /hnc/frontend/{name} && pnpm install

2. **Configure Vite proxy (for local dev):**
   Edit vite.config.ts to proxy API requests to backend

3. **Create GitHub repo:**
   gh repo create hnc-partners/hnc-{name}-fe --private --source=. --push

4. **Configure deployment:**
   - Set up GitHub Pages or Vercel
   - Configure production API URL

5. **Start development:**
   pnpm dev

6. **Deploy (when ready):**
   Run `/deploy-new-fe {name}-fe` - this handles CORS config, routing, and MF registration

Project location: /hnc/frontend/{name}
Accent color: {color_name} ({hex_color})
```

---

## Error Handling

- If service name already exists, warn and abort
- If BE port allocation fails, suggest manual allocation
- If FE template clone fails, provide manual instructions
- If BMAD setup script fails, show manual symlink commands

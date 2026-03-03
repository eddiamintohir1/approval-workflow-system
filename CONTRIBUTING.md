# CONTRIBUTING — Rules for AI Agents & Developers

> **Read this entire file before making any changes to this project.**  
> These rules exist because past AI sessions introduced breaking bugs by not following them.

---

## ⚠️ Rule 1 — Never Create a New MySQL Pool

The project has **one shared MySQL connection pool** exported from `server/db.ts`:

```typescript
import { mysqlPool } from "../db";   // ✅ correct
import { db } from "../db";          // ✅ correct (Drizzle ORM wrapper)

// ❌ NEVER do this in any other file:
const pool = mysql.createPool({ ... });
```

**Why:** Multiple pools exhaust database connections and cause silent failures under load.

---

## ⚠️ Rule 2 — Never Run Drizzle CLI Interactively

```bash
# ❌ NEVER run these:
pnpm drizzle-kit push
pnpm drizzle-kit generate

# ✅ ALWAYS use this instead:
# 1. Edit drizzle/schema.ts
# 2. Write the SQL manually
# 3. Apply via webdev_execute_sql tool in Manus
#    OR run: node run_sql.mjs "YOUR SQL HERE"
```

**Why:** The database has many pre-existing tables. Drizzle's interactive migration will prompt to confirm hundreds of conflicts and may drop or alter tables unexpectedly.

---

## ⚠️ Rule 3 — Two Sequence Generators Exist — Do Not Confuse Them

| Generator | File | Route | Purpose |
|-----------|------|-------|---------|
| **OLD** (internal) | `client/src/pages/admin/SequenceGenerator.tsx` | `/admin/sequences` | MAF, PR, CATTO, SKU, PAF workflow numbers |
| **NEW** (documents) | `client/src/pages/DocumentSequenceGenerator.tsx` | `/document-sequence` | SOP, IK, PKWT, FORM, MEMO etc. |

When asked about "the sequence generator" or "document numbering", always use the **NEW** one at `/document-sequence`.

---

## ⚠️ Rule 4 — Two Databases Exist — Use MySQL for All New Features

| Database | Env Var | Use For |
|----------|---------|---------|
| **MySQL/TiDB** (PRIMARY) | `DATABASE_URL` | All new features, all app data |
| **PostgreSQL/RDS** (LEGACY) | `CUSTOM_DATABASE_URL` | Do NOT use — private VPC, unreachable from dev server |

---

## ⚠️ Rule 5 — Pre-existing TypeScript Errors Are Normal

`server/routers.ts` has ~157 pre-existing TypeScript errors. **The app runs fine.** Do not attempt to fix them without full context — they involve complex type mismatches in a 2400-line file.

If you add new code and the TS error count stays the same or goes down, you are fine.

---

## ⚠️ Rule 6 — LIMIT/OFFSET in MySQL Must Use Interpolated Integers

```typescript
// ❌ BAD — causes "Incorrect arguments to LIMIT" error:
await pool.execute("SELECT * FROM t LIMIT ? OFFSET ?", [limit, offset]);

// ✅ GOOD — interpolate validated integers directly:
const safeLimit = Math.max(1, Math.min(100, Number(limit)));
const safeOffset = Math.max(0, Number(offset));
await pool.execute(`SELECT * FROM t LIMIT ${safeLimit} OFFSET ${safeOffset}`);
```

---

## ⚠️ Rule 7 — Never Add Empty String Values to SelectItem

```tsx
// ❌ BAD — crashes React with "Select.Item must have a non-empty value":
<SelectItem value="">All</SelectItem>

// ✅ GOOD — use a sentinel string:
<SelectItem value="all">All</SelectItem>
// Then in filter logic: if (value !== "all") { ... }
```

---

## ⚠️ Rule 8 — Always Verify Build Passes Before Checkpoint

```bash
cd /home/ubuntu/approval_workflow_system
timeout 25 npx vite build 2>&1 | tail -5
# Must end with: ✓ built in XX.XXs
```

If the build fails, fix it before calling `webdev_save_checkpoint`.

---

## Key File Map

```
drizzle/schema.ts                           → MySQL table definitions
server/db.ts                                → mysqlPool + db (Drizzle) exports — SINGLE SOURCE OF TRUTH
server/routers.ts                           → ALL tRPC procedures (2400+ lines)
server/routers/documentSequence.ts          → Document sequence generator
server/routers/skuGenerator.ts              → SKU generator
client/src/App.tsx                          → All frontend routes
client/src/components/DashboardLayout.tsx   → Sidebar navigation
client/src/pages/DocumentSequenceGenerator.tsx → NEW document numbering page
client/src/pages/admin/SequenceGenerator.tsx   → OLD internal workflow numbering
run_sql.mjs                                 → Portable SQL runner (substitute for webdev_execute_sql)
obsidian-vault/                             → Full project context for AI agents
```

---

## Quick Commands

```bash
# Apply SQL migration (safe alternative to drizzle-kit):
cd /home/ubuntu/approval_workflow_system
node run_sql.mjs "ALTER TABLE doc_sequences ADD COLUMN notes TEXT"

# Verify build:
timeout 25 npx vite build 2>&1 | tail -3

# Push to GitHub:
git push github main
# If rejected: git fetch github main && git merge github/main --no-edit && git push github main
```

---

*Last updated: 2026-03-03 | Version: v1.12*

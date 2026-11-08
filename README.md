# reports-next

Next.js rewrite of the Laravel `Reports` app from
[techeverythingpal-code/newMe](https://github.com/techeverythingpal-code/newMe).

It connects to the **same MySQL database** the Laravel app uses, so both apps
can run side by side while sections are moved over one at a time. Existing
admin and supervisor passwords keep working (Laravel's `$2y$` bcrypt hashes are
read as-is).

## Stack

- Next.js 16 (App Router, Server Components, Server Actions), React 19, TypeScript
- Tailwind CSS 4 (brand colors copied from the Laravel app)
- Drizzle ORM + `mysql2` (schema in `src/db/schema.ts` mirrors the Laravel migrations)
- Login: signed, httpOnly cookie (`jose`), passwords checked with `bcryptjs`

## Getting started

1. Start MySQL (XAMPP) with the `reportsdb` database the Laravel app already uses.
2. Copy `.env.example` to `.env.local` and fill in `DATABASE_URL` and `SESSION_SECRET`.
3. Install and run:

   ```bash
   npm install
   npm run dev
   ```

4. Open http://localhost:3000 and sign in with an admin email or a supervisor name.

## What is ported so far

| Area | Status |
|---|---|
| Login (admin by email, supervisor by name), logout | ✅ |
| Forced password change for supervisors on a temporary password | ✅ |
| Route protection: signed-in, admin-only, supervisor sees only own teachers | ✅ |
| RTL Arabic layout with sidebar | ✅ |
| Dashboard (counts) | ✅ basic, charts not yet |
| Directorates: list, add, edit, delete (blocked when it has schools) | ✅ |
| Schools: list, add, edit, delete (blocked when it has teachers) | ✅ |
| Supervisors: list, add, edit (incl. ID change), delete, stats page | ✅ radar chart not yet |
| Excel import/export for schools and supervisors (.xlsx and .csv) | ✅ |
| Teachers, grades sheet, justification, supervisor note | ⏳ placeholder page |
| Printable reports (single and bulk, Amiri font) | ⏳ fonts copied to `public/fonts` |
| Excel import/export for teachers | ⏳ |
| Profile, forgot/reset password | ⏳ |
| Login rate limiting (Laravel allows 5 tries) | ⏳ |

## How the code is organised

```
src/
  proxy.ts                 first-pass guard: signed-out visitors go to /login
  db/schema.ts             tables, same names/columns as the Laravel database
  db/index.ts              connection pool
  lib/session.ts           requireUser() / requireAdmin(): call in every page and action
  lib/password.ts          bcrypt check/hash compatible with Laravel
  app/(auth)/              login and forced password change (no sidebar)
  app/(app)/               signed-in pages with the sidebar
    directorates/          the worked example to copy for other sections
```

To port a section, copy the `directorates` folder: a `page.tsx` that reads with
Drizzle, an `actions.ts` with server actions that start with `requireAdmin()`
or `requireUser()`, and a client form using `useActionState`.

**Security rule:** every page and every server action must call
`requireUser()` or `requireAdmin()` itself. Supervisor queries must filter by
`teachers.supervisorId = user.id`, as the Laravel controllers do.

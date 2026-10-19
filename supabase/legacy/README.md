# Legacy SQL (archived)

These files are kept for historical reference only.

**Do not run them against any database.** They were written at different times,
overwrite each other, and several of them are unsafe:

- `UPDATE_FAIR_RANKING.sql` contains `ALTER TABLE public.tryout_results DISABLE ROW LEVEL SECURITY;`
- `RLS_HARDENING_FINAL.sql` drops every policy in the `public` schema, including
  policies for tables it does not recreate (for example `notifications`).
- `MASTER_DATABASE_SETUP.sql` does not match the live schema (missing
  `duration_minutes`, `sub_category`, `option_images`, `phone_number`,
  `price_snapshot`, and others).

The source of truth is now `supabase/migrations/`, applied in filename order.

If you need to rebuild a local database:

```bash
supabase db reset
```

If you need to compare the repository with the linked project:

```bash
supabase db diff --linked
```

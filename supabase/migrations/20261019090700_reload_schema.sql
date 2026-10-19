-- PostgREST schema cache refresh after migration-managed objects are created.
notify pgrst, 'reload schema';

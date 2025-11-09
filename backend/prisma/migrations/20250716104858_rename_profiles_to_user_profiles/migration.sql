-- Rename profiles table to user_profiles if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'profiles'
    ) THEN
        ALTER TABLE "profiles" RENAME TO "user_profiles";
    END IF;
END $$;

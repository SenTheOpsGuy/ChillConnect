-- Create employee user if not exists
DO $$
DECLARE
    user_exists boolean;
    hashed_password text;
BEGIN
    -- Check if user already exists
    SELECT EXISTS(SELECT 1 FROM users WHERE email = 'sentheopsguy@gmail.com') INTO user_exists;
    
    -- Only create if doesn't exist
    IF NOT user_exists THEN
        -- Bcrypt hash for 'voltas-beko' with salt rounds 12
        hashed_password := '$2a$12$2bGnIkYDlGMDwdTYdvaev.ugZIMq5pXGY71KDfD7TiLldmodVLc/e';
        
        INSERT INTO users (
            id, 
            email, 
            "passwordHash", 
            role, 
            "isEmailVerified", 
            "isAgeVerified",
            "consentGiven",
            "createdAt", 
            "updatedAt"
        ) VALUES (
            gen_random_uuid(),
            'sentheopsguy@gmail.com',
            hashed_password,
            'EMPLOYEE'::UserRole,
            true,
            true,
            true,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Employee user created successfully';
    ELSE
        RAISE NOTICE 'Employee user already exists';
    END IF;
END $$;
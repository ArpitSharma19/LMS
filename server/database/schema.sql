-- LMS Supabase/PostgreSQL Production Schema (FIXED)
-- Compatible with Supabase (PG 14+)

-- =========================
-- 0. EXTENSIONS
-- =========================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- 1. UPDATED_AT TRIGGER FUNCTION
-- =========================

CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================
-- 2. USERS TABLE
-- =========================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT,
    role TEXT DEFAULT 'student' CHECK (role IN ('student', 'educator', 'admin')),
    image_url TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'blocked')),
    is_verified BOOLEAN DEFAULT FALSE,
    otp TEXT,
    otp_expiry TIMESTAMPTZ,
    streak INTEGER DEFAULT 0,
    last_active_date TIMESTAMPTZ,
    completed_dates JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER tr_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- =========================
-- 3. EDUCATORS TABLE
-- =========================

CREATE TABLE IF NOT EXISTS educators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    qualification TEXT,
    experience TEXT,
    bio TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE TRIGGER tr_educators_updated_at
BEFORE UPDATE ON educators
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- =========================
-- 4. COURSES TABLE
-- =========================

CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    thumbnail TEXT,
    price DECIMAL(10,2) NOT NULL,
    is_published BOOLEAN DEFAULT TRUE,
    discount INTEGER DEFAULT 0 CHECK (discount BETWEEN 0 AND 100),
    educator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    category TEXT DEFAULT 'General',
    rating_average DECIMAL(3,2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER tr_courses_updated_at
BEFORE UPDATE ON courses
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- =========================
-- 5. CHAPTERS TABLE
-- =========================

CREATE TABLE IF NOT EXISTS chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER tr_chapters_updated_at
BEFORE UPDATE ON chapters
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- =========================
-- 6. LECTURES TABLE
-- =========================

CREATE TABLE IF NOT EXISTS lectures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    duration INTEGER DEFAULT 0,
    url TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    is_preview BOOLEAN DEFAULT FALSE,
    description TEXT,
    resources JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER tr_lectures_updated_at
BEFORE UPDATE ON lectures
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- =========================
-- 7. ENROLLMENTS
-- =========================

CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

-- =========================
-- 8. COURSE PROGRESS
-- =========================

CREATE TABLE IF NOT EXISTS course_progresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

CREATE TRIGGER tr_course_progresses_updated_at
BEFORE UPDATE ON course_progresses
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- =========================
-- 9. LECTURE COMPLETIONS (FIXED CORE ISSUE)
-- =========================

CREATE TABLE IF NOT EXISTS lecture_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    progress_id UUID NOT NULL REFERENCES course_progresses(id) ON DELETE CASCADE,
    lecture_id UUID NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'completed'
        CHECK (status IN ('completed', 'skipped', 'pending')),
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(progress_id, lecture_id)
);

-- =========================
-- 10. RATINGS
-- =========================

CREATE TABLE IF NOT EXISTS ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

CREATE TRIGGER tr_ratings_updated_at
BEFORE UPDATE ON ratings
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- =========================
-- 11. PURCHASES (STRIPE INTEGRATED)
-- =========================

CREATE TABLE IF NOT EXISTS purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    stripe_session_id TEXT,
    amount DECIMAL(10,2) NOT NULL,
    commission_amount DECIMAL(10,2) DEFAULT 0,
    educator_amount DECIMAL(10,2) DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

-- =========================
-- 12. INDEXES
-- =========================

CREATE INDEX IF NOT EXISTS idx_courses_educator ON courses(educator_id);
CREATE INDEX IF NOT EXISTS idx_chapters_course ON chapters(course_id);
CREATE INDEX IF NOT EXISTS idx_lectures_chapter ON lectures(chapter_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_user_course ON course_progresses(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_lecture_completions_progress ON lecture_completions(progress_id);

-- =========================
-- 13. RLS (SAFE BASE SETUP)
-- =========================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Safe minimal policies
CREATE POLICY "Public courses read"
ON courses FOR SELECT
USING (is_published = true);

CREATE POLICY "User access own data"
ON users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "User enrollments"
ON enrollments FOR SELECT
USING (auth.uid() = user_id);
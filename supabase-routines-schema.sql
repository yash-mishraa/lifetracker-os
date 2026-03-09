-- Routines Schema

-- Create Routines Table
CREATE TABLE IF NOT EXISTS public.routines (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('morning', 'night', 'other')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Routines
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own routines" ON public.routines
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own routines" ON public.routines
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own routines" ON public.routines
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own routines" ON public.routines
    FOR DELETE USING (auth.uid() = user_id);


-- Create Routine Steps Table
CREATE TABLE IF NOT EXISTS public.routine_steps (
    id UUID PRIMARY KEY,
    routine_id UUID REFERENCES public.routines(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    position INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Routine Steps
ALTER TABLE public.routine_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own routine steps" ON public.routine_steps
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own routine steps" ON public.routine_steps
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own routine steps" ON public.routine_steps
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own routine steps" ON public.routine_steps
    FOR DELETE USING (auth.uid() = user_id);


-- Create Routine Logs Table
CREATE TABLE IF NOT EXISTS public.routine_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    routine_id UUID REFERENCES public.routines(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    completed_step_ids UUID[] DEFAULT '{}'::UUID[],
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(routine_id, date)
);

-- Enable RLS for Routine Logs
ALTER TABLE public.routine_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own routine logs" ON public.routine_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own routine logs" ON public.routine_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own routine logs" ON public.routine_logs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own routine logs" ON public.routine_logs
    FOR DELETE USING (auth.uid() = user_id);

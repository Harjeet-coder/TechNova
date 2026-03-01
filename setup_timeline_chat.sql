-- 1. Drop the old tables just in case they are stuck in a bad state
DROP TABLE IF EXISTS case_updates CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;

-- 2. Create the Timeline table properly
CREATE TABLE case_updates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    case_id UUID REFERENCES cases(case_id) ON DELETE CASCADE,
    update_text TEXT NOT NULL,
    updated_by_wallet TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create the Chat table properly
CREATE TABLE chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    case_id UUID REFERENCES cases(case_id) ON DELETE CASCADE,
    sender_wallet TEXT NOT NULL,
    sender_role TEXT NOT NULL, 
    encrypted_message TEXT NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CRITICAL FIX: Grant explicit permissions so the API can insert data!
GRANT ALL ON TABLE case_updates TO anon, authenticated, service_role;
GRANT ALL ON TABLE chat_messages TO anon, authenticated, service_role;

-- 5. Hard Reload the Cache automatically
NOTIFY pgrst, 'reload schema';

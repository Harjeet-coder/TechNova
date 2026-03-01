-- Table for Timeline Updates (Investigator actions)
CREATE TABLE IF NOT EXISTS case_updates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    update_text TEXT NOT NULL,
    updated_by_wallet TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for End-to-End Encrypted Chat (Whistleblower <-> Investigator)
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    sender_wallet TEXT NOT NULL,
    sender_role TEXT NOT NULL, -- 'whistleblower' or 'investigator'
    encrypted_message TEXT NOT NULL, -- Encrypted using the shared AES-256 case key
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: Ensure both tables have Realtime enabled in the Supabase Dashboard if you plan to use WebSockets!

const supabase = require('../config/supabase');

// --- Timeline Updates ---
exports.getTimeline = async (req, res) => {
    try {
        const { case_id } = req.params;
        const { data, error } = await supabase
            .from('case_updates')
            .select('*')
            .eq('case_id', case_id)
            .order('created_at', { ascending: true });

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        console.error('Fetch timeline error:', error);
        res.status(500).json({ error: 'Internal error fetching timeline' });
    }
};

exports.addTimelineUpdate = async (req, res) => {
    try {
        const { case_id, update_text, updated_by_wallet } = req.body;

        const { data, error } = await supabase
            .from('case_updates')
            .insert([{
                case_id,
                update_text,
                updated_by_wallet: updated_by_wallet.toLowerCase()
            }])
            .select();

        if (error) throw error;

        // Optionally, update the 'cases.status' based on the update (e.g., 'investigating')
        await supabase
            .from('cases')
            .update({ status: 'investigating' })
            .eq('id', case_id)
            .eq('status', 'waiting_for_authority_approval');

        res.status(200).json(data[0]);
    } catch (error) {
        console.error('Add timeline error:', error);
        res.status(500).json({ error: 'Internal error adding timeline update' });
    }
};

// --- E2E Encrypted Chat ---
exports.getMessages = async (req, res) => {
    try {
        const { case_id } = req.params;
        const { data, error } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('case_id', case_id)
            .order('created_at', { ascending: true });

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        console.error('Fetch messages error:', error);
        res.status(500).json({ error: 'Internal error fetching messages' });
    }
};

exports.sendMessage = async (req, res) => {
    try {
        const { case_id, encrypted_message, sender_wallet, sender_role } = req.body;

        const { data, error } = await supabase
            .from('chat_messages')
            .insert([{
                case_id,
                sender_wallet: sender_wallet.toLowerCase(),
                sender_role,
                encrypted_message
            }])
            .select();

        if (error) throw error;
        res.status(200).json(data[0]);
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Internal error sending message' });
    }
};

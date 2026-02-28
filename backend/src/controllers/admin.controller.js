const { verifySignature } = require('../utils/signature');
const supabase = require('../config/supabase');

exports.verifyWallet = async (req, res) => {
    try {
        const { message, signature, address } = req.body;

        if (!verifySignature(message, signature, address)) {
            return res.status(401).json({ error: 'Invalid wallet signature' });
        }

        const { data, error } = await supabase
            .from('admin')
            .select('*')
            .eq('wallet_address', address.toLowerCase())
            .single();

        if (error || !data) {
            return res.status(403).json({ error: 'Admin not found or unauthorized' });
        }

        res.status(200).json({ message: 'Admin verified successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal error' });
    }
};

exports.assignInvestigator = async (req, res) => {
    try {
        const { case_id, investigator_id } = req.body;
        const { error } = await supabase
            .from('cases')
            .update({ assigned_to: investigator_id, status: 'assigned' })
            .eq('case_id', case_id);

        if (error) throw error;
        res.status(200).json({ message: 'Investigator assigned' });
    } catch (error) {
        res.status(500).json({ error: 'Internal error' });
    }
};

exports.getStats = async (req, res) => {
    try {
        const { count: totalCases } = await supabase.from('cases').select('*', { count: 'exact', head: true });
        const { count: revealedCases } = await supabase.from('cases').select('*', { count: 'exact', head: true }).eq('reveal_status', 'revealed');
        res.status(200).json({ totalCases, revealedCases });
    } catch (error) {
        res.status(500).json({ error: 'Internal error' });
    }
};

exports.getAllCases = async (req, res) => {
    try {
        const { data, error } = await supabase.from('cases').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Internal error' });
    }
};

exports.getAllInvestigators = async (req, res) => {
    try {
        const { data, error } = await supabase.from('investigators').select('*');
        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Internal error' });
    }
};

exports.getAdminKeys = async (req, res) => {
    try {
        const { data, error } = await supabase.from('admin').select('wallet_address, public_key');
        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Internal error fetching admin keys' });
    }
};

exports.getAccessRequests = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('access_requests')
            .select(`
                id, status, created_at, case_id,
                cases ( title, category, ipfs_cid ),
                investigators ( wallet_address, name, loyalty_score )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Also fetch approval counts for requests
        const { data: approvals, error: appErr } = await supabase.from('approved_shares').select('request_id');
        if (appErr) throw appErr;

        const requestsWithCounts = data.map(req => {
            const count = approvals.filter(a => a.request_id === req.id).length;
            return { ...req, approvals_count: count };
        });

        res.status(200).json(requestsWithCounts);
    } catch (error) {
        console.error('Fetch access requests error:', error);
        res.status(500).json({ error: 'Internal error' });
    }
};

exports.approveRequest = async (req, res) => {
    try {
        const { request_id, case_id, admin_address } = req.body;

        // 1. Fetch exactly the SSS piece assigned mathematically to THIS Admin wallet
        const { data: shareData, error: shareErr } = await supabase
            .from('admin_key_shares')
            .select('encrypted_share')
            .eq('case_id', case_id)
            .eq('admin_address', admin_address.toLowerCase())
            .single();

        if (shareErr || !shareData) {
            return res.status(403).json({ error: 'No SSS share found assigned directly to your wallet.' });
        }

        const actualEncryptedShare = shareData.encrypted_share;

        // Check if this admin already approved this exact request
        const { data: existingApproval } = await supabase
            .from('approved_shares')
            .select('id')
            .eq('request_id', request_id)
            .eq('admin_address', admin_address.toLowerCase())
            .single();

        if (existingApproval) {
            return res.status(400).json({ error: 'You have already released your share for this case.' });
        }

        // 3. Store the actual mathematical share for the Investigator
        const { error: insertErr } = await supabase.from('approved_shares').insert([{
            request_id,
            admin_address: admin_address.toLowerCase(),
            encrypted_share_for_investigator: actualEncryptedShare
        }]);

        if (insertErr) {
            // Already approved by this admin
            if (insertErr.code === '23505') return res.status(400).json({ error: 'Already approved by you' });
            throw insertErr;
        }

        // Check threshold
        const { data: approvals, error: countErr } = await supabase
            .from('approved_shares')
            .select('id')
            .eq('request_id', request_id);

        if (countErr) throw countErr;

        if (approvals.length >= 2) {
            await supabase.from('access_requests').update({ status: 'approved' }).eq('id', request_id);
            await supabase.from('cases').update({ status: 'investigating' }).eq('case_id', case_id);
        }

        res.status(200).json({ message: 'Approval recorded. Share transferred to Investigator securely.' });
    } catch (error) {
        console.error('Approve request error:', error);
        res.status(500).json({ error: 'Internal error' });
    }
};
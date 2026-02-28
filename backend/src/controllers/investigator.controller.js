const { verifySignature } = require('../utils/signature');
const supabase = require('../config/supabase');

exports.verifyWallet = async (req, res) => {
    try {
        const { message, signature, address } = req.body;

        if (!verifySignature(message, signature, address)) {
            return res.status(401).json({ error: 'Invalid wallet signature' });
        }

        const { data, error } = await supabase
            .from('investigators')
            .select('*')
            .eq('wallet_address', address.toLowerCase())
            .single();

        if (error || !data) {
            return res.status(403).json({ error: 'Investigator not found or unauthorized' });
        }

        res.status(200).json({ message: 'Verified successfully', investigator: data });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.listCases = async (req, res) => {
    try {
        const { investigator_address } = req.query;

        // 1. Get investigator's category and id
        const { data: investigator, error: invErr } = await supabase
            .from('investigators')
            .select('investigator_id, category')
            .eq('wallet_address', investigator_address.toLowerCase())
            .single();

        if (invErr || !investigator) return res.status(403).json({ error: 'Investigator not found' });

        // 2. Fetch cases matching investigator's category (only metadata, no CID or hashes for security)
        const { data: cases, error: casesErr } = await supabase
            .from('cases')
            .select('case_id, title, description, category, status, created_at')
            .eq('category', investigator.category)
            .order('created_at', { ascending: false });

        if (casesErr) throw casesErr;

        // 3. Get access_requests made by this investigator
        const { data: requests, error: reqErr } = await supabase
            .from('access_requests')
            .select('case_id, status')
            .eq('investigator_id', investigator.investigator_id);

        if (reqErr) throw reqErr;

        // Merge request status into cases
        const processedCases = cases.map(c => {
            const req = requests.find(r => r.case_id === c.case_id);
            return {
                ...c,
                request_status: req ? req.status : 'none'
            };
        });

        res.status(200).json(processedCases);
    } catch (error) {
        console.error('List cases error:', error);
        res.status(500).json({ error: 'Internal error' });
    }
};

exports.requestAccess = async (req, res) => {
    try {
        const { case_id, investigator_address } = req.body;

        // Get investigator ID
        const { data: investigator, error: invErr } = await supabase
            .from('investigators')
            .select('investigator_id')
            .eq('wallet_address', investigator_address.toLowerCase())
            .single();

        if (invErr || !investigator) return res.status(403).json({ error: 'Investigator not found' });

        // Insert request
        const { error } = await supabase
            .from('access_requests')
            .insert([{ case_id, investigator_id: investigator.investigator_id, status: 'pending' }]);

        if (error) throw error;

        // Optional: Update case status visible to whistleblower
        const { error: caseErr } = await supabase.from('cases').update({ status: 'waiting_for_authority_approval' }).eq('case_id', case_id);

        res.status(200).json({ message: 'Access requested securely' });
    } catch (error) {
        console.error('Request access error:', error);
        res.status(500).json({ error: 'Internal error' });
    }
};

exports.downloadEncryptedFile = async (req, res) => {
    try {
        const { case_id } = req.params;
        const { data, error } = await supabase
            .from('cases')
            .select('ipfs_cid')
            .eq('case_id', case_id)
            .single();

        if (error || !data) return res.status(404).json({ error: 'Item not found' });

        // Fetch the file server-side to bypass Pinata Gateway CORS restrictions for the frontend
        const axios = require('axios');
        const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${data.ipfs_cid}`;
        const ipfsResponse = await axios.get(ipfsUrl, { responseType: 'text' });

        res.status(200).send(ipfsResponse.data);
    } catch (error) {
        res.status(500).json({ error: 'Internal error' });
    }
};

exports.updateReport = async (req, res) => {
    try {
        const { case_id, status_update, notes, rating } = req.body;
        const { error } = await supabase
            .from('cases')
            .update({
                investigator_notes: notes,
                status: status_update
            })
            .eq('case_id', case_id);

        if (error) throw error;

        // Rate case logic handling... Assuming reputation mapping to anon_id
        res.status(200).json({ message: 'Report updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal error' });
    }
};

exports.getApprovedShares = async (req, res) => {
    try {
        const { case_id, investigator_address } = req.query;

        // Get investigator ID
        const { data: investigator, error: invErr } = await supabase
            .from('investigators')
            .select('investigator_id')
            .eq('wallet_address', investigator_address.toLowerCase())
            .single();

        if (invErr || !investigator) return res.status(403).json({ error: 'Investigator not found' });

        // Get request ID
        const { data: request, error: reqErr } = await supabase
            .from('access_requests')
            .select('id')
            .eq('case_id', case_id)
            .eq('investigator_id', investigator.investigator_id)
            .single();

        if (reqErr || !request) return res.status(404).json({ error: 'Wait for Access Request approval to fetch SSS shares' });

        // Get Shares
        const { data: shares, error: shareErr } = await supabase
            .from('approved_shares')
            .select('encrypted_share_for_investigator')
            .eq('request_id', request.id);

        if (shareErr) throw shareErr;

        // For successful decryption of evidence
        const { data: caseMeta } = await supabase.from('cases').select('ipfs_cid, file_hash').eq('case_id', case_id).single();

        res.status(200).json({ shares: shares.map(s => s.encrypted_share_for_investigator), metadata: caseMeta });
    } catch (error) {
        console.error('Fetch shares error:', error);
        res.status(500).json({ error: 'Internal error' });
    }
};
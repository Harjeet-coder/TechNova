const fs = require('fs');
const { hashFile } = require('../utils/hash');
const { stripMetadata } = require('../utils/metadata');
const { uploadFile } = require('../services/ipfs.service');
const { computeAuthenticityScore } = require('../services/authenticity.service');
const { registerCase, storeAuthenticityScore } = require('../services/blockchain.service');
const supabase = require('../config/supabase');

exports.uploadEvidence = async (req, res) => {
    try {
        const { anon_id, reveal_mode, reveal_timestamp, description, title, category, admin_shares } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'Encrypted evidence file is required' });
        }

        // 1. Strip Metadata
        stripMetadata(file.path);

        // 2. Hash encrypted file
        const fileHash = await hashFile(file.path);

        // 3. Upload to IPFS
        const cid = await uploadFile(file.path);

        // 4. Authenticity score
        const authScore = await computeAuthenticityScore(file.path);

        // Clean up temp file
        fs.unlinkSync(file.path);

        // 5. Store in Supabase cases table
        const { data: currentCases, error: caseErr } = await supabase
            .from('cases')
            .insert([{
                anon_id,
                ipfs_cid: cid,
                file_hash: fileHash,
                title,
                category,
                reveal_mode,
                reveal_timestamp: reveal_mode === 'time_based' ? reveal_timestamp : null,
                authenticity_score: authScore,
                description,
                status: 'submitted',
                reveal_status: reveal_mode === 'immediate' ? 'revealed' : 'locked'
            }]).select();

        if (caseErr) throw caseErr;
        const caseId = currentCases[0].case_id;

        // Store Admin SSS Shares if provided
        if (admin_shares) {
            const sharesArray = typeof admin_shares === 'string' ? JSON.parse(admin_shares) : admin_shares;
            const sharesToInsert = sharesArray.map(share => ({
                case_id: caseId,
                admin_address: share.admin_address.toLowerCase(),
                encrypted_share: share.encrypted_share
            }));

            const { error: sharesErr } = await supabase.from('admin_key_shares').insert(sharesToInsert);
            if (sharesErr) console.error("Failed storing SSS shares:", sharesErr);
        }

        // 6. Blockchain interaction
        await registerCase(cid, fileHash, anon_id, reveal_mode);
        await storeAuthenticityScore(caseId, authScore);

        res.status(201).json({
            message: 'Evidence submitted successfully',
            case_id: caseId,
            cid: cid,
            authenticity_score: authScore
        });

    } catch (error) {
        console.error('Evidence upload error:', error);
        res.status(500).json({ error: 'Internal server error while processing evidence' });
    }
};

exports.getCaseStatus = async (req, res) => {
    try {
        const { case_id } = req.params;
        const { data, error } = await supabase
            .from('cases')
            .select('*, authority_approvals(*)')
            .eq('case_id', case_id)
            .single();

        if (error || !data) return res.status(404).json({ error: 'Case not found' });

        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.verifyCategory = async (req, res) => {
    try {
        const { case_id, zk_category } = req.body;
        const { error } = await supabase
            .from('cases')
            .update({ zk_category })
            .eq('case_id', case_id);

        if (error) throw error;

        res.status(200).json({ message: 'Zero-knowledge category verified' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getWhistleblowerCases = async (req, res) => {
    try {
        const { anon_id } = req.params;
        const { data, error } = await supabase
            .from('cases')
            .select('*')
            .eq('anon_id', anon_id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.status(200).json(data || []);
    } catch (error) {
        console.error('Error fetching whistleblower cases:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.triggerReveal = async (req, res) => {
    try {
        const { case_id, anon_id } = req.body;
        // Verify anon_id is the owner
        const { data, error } = await supabase.from('cases').select('anon_id, reveal_mode').eq('case_id', case_id).single();
        if (error || !data) return res.status(404).json({ error: 'Case not found' });
        if (data.anon_id.toLowerCase() !== anon_id.toLowerCase()) return res.status(403).json({ error: 'Unauthorized. You do not own this case.' });
        if (data.reveal_mode !== 'trigger') return res.status(400).json({ error: 'Case is not in manual trigger mode.' });

        const { error: updateErr } = await supabase.from('cases').update({ reveal_status: 'revealed' }).eq('case_id', case_id);
        if (updateErr) throw updateErr;

        res.status(200).json({ message: 'Evidence successfully revealed to the network.' });
    } catch (error) {
        console.error('Trigger reveal error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
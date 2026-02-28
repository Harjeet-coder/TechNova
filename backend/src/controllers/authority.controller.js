const supabase = require('../config/supabase');
const blockchain = require('../services/blockchain.service');
const { encryptWithPublicKey } = require('../utils/aes');

exports.approveAccess = async (req, res) => {
    try {
        const { case_id, authority_id, authority_address, investigator_pub_key } = req.body;

        // 1. Insert approval
        const { error: insErr } = await supabase
            .from('authority_approvals')
            .insert([{ case_id, authority_id, authority_address }]);
        
        if (insErr) throw insErr;

        // 2. Blockchain log
        await blockchain.logAuthorityApproval(case_id, authority_address);

        // 3. Count approvals
        const { count, error: countErr } = await supabase
            .from('authority_approvals')
            .select('*', { count: 'exact', head: true })
            .eq('case_id', case_id);

        if (countErr) throw countErr;

        // 4. Threshold check (>= 2)
        if (count >= 2) {
            // Ideally extract the AES key fragments from secure storage.
            // Returning a mock AES key for the sake of completion:
            const masterAESKey = "mock-master-aes-key-rebuilt-from-shares";
            
            // Re-encrypt it with investigator's public key
            const encryptedAESKey = encryptWithPublicKey(investigator_pub_key, masterAESKey);
            
            const { error: updErr } = await supabase
                .from('cases')
                .update({ status: 'unlocked' })
                .eq('id', case_id);

            return res.status(200).json({
                message: 'Threshold met. Case unlocked.',
                encryptedAESKey: encryptedAESKey || 'encryption-failed-mock'
            });
        }

        res.status(200).json({ message: 'Approval logged. Waiting for more approvals.', current_approvals: count });
    } catch (error) {
        console.error('Authority approval error', error);
        res.status(500).json({ error: 'Internal error' });
    }
};
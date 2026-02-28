const supabase = require('../config/supabase');

exports.checkRole = async (req, res) => {
    try {
        const { address } = req.query;
        if (!address) return res.status(400).json({ error: 'Address is required' });

        const wallet = address.toLowerCase();

        // Check if Admin
        const { data: admin } = await supabase
            .from('admin')
            .select('wallet_address')
            .eq('wallet_address', wallet)
            .single();

        if (admin) {
            return res.status(200).json({ role: 'admin' });
        }

        // Check if Investigator
        const { data: inv } = await supabase
            .from('investigators')
            .select('wallet_address')
            .eq('wallet_address', wallet)
            .single();

        if (inv) {
            return res.status(200).json({ role: 'investigator' });
        }

        // Default to whistleblower
        return res.status(200).json({ role: 'whistleblower' });
    } catch (error) {
        console.error('Role Check Error:', error);
        return res.status(500).json({ error: 'Failed to verify account role' });
    }
};

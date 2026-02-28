const { triggerReveal } = require('../services/reveal.service');

exports.manualReveal = async (req, res) => {
    // End point for manual reveal, or to ping activity timestamp for DMT
    try {
        const { case_id, reason } = req.body;
        await triggerReveal(case_id, reason);
        res.status(200).json({ message: 'Reveal triggered successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal error' });
    }
};
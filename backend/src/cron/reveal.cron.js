const cron = require('node-cron');
const supabase = require('../config/supabase');
const { triggerReveal } = require('../services/reveal.service');

function initCron() {
    // Runs every minute
    cron.schedule('* * * * *', async () => {
        try {
            // Find cases with timed reveal expired or dead-man-trigger timeout (Simulated with simple time check)
            const { data: cases, error } = await supabase
                .from('cases')
                .select('*')
                .eq('reveal_status', 'locked');

            if (error || !cases) return;

            const now = new Date();

            for (let c of cases) {
                if (c.reveal_mode === 'timed_reveal' && c.reveal_timestamp) {
                    if (new Date(c.reveal_timestamp) < now) {
                        await triggerReveal(c.id, 'Timed reveal expired');
                    }
                }
                
                // If safety confirmation / Dead man trigger:
                if (c.reveal_mode === 'dead_man_trigger' && c.last_active_timestamp) {
                    // Say, 24 hour timeout
                    const timeout = 24 * 60 * 60 * 1000;
                    if ((now - new Date(c.last_active_timestamp)) > timeout) {
                        await triggerReveal(c.id, 'Dead-man trigger inactivity timeout');
                    }
                }
            }
        } catch (error) {
            console.error("Cron Job Error:", error);
        }
    });
    console.log("Reveal Cron Job Initialized");
}

module.exports = { initCron };
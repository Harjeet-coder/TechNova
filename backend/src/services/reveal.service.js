const supabase = require('../config/supabase');
const blockchain = require('./blockchain.service');

async function triggerReveal(caseId, reason) {
    console.log(`Triggering reveal for case ${caseId} due to ${reason}`);
    
    // Update case in Supabase
    const { error } = await supabase
        .from('cases')
        .update({ reveal_status: 'revealed', updated_at: new Date() })
        .eq('id', caseId);

    if (error) {
        console.error("Reveal trigger update error:", error);
    } else {
        // Log reveal event
        await supabase.from('reveal_events').insert({
             case_id: caseId,
             reason: reason,
             triggered_at: new Date()
        });
        // Update Blockchain
        await blockchain.updateRevealState(caseId);
    }
}

module.exports = {
    triggerReveal
};
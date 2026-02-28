const supabase = require('../config/supabase');

async function saveMessage(caseId, encryptedMessage, senderPublicKey, senderType) {
    const { data, error } = await supabase.from('chat_messages').insert([{
        case_id: caseId,
        encrypted_message: encryptedMessage,
        sender_public_key: senderPublicKey,
        sender_type: senderType,
        created_at: new Date()
    }]).select();

    if (error) throw error;
    return data[0];
}

module.exports = {
    saveMessage
};
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// ---------------------------------------------------------
// 🚨 HACKATHON SETUP: CONFIGURE YOUR 6 METAMASK ACCOUNTS
// ---------------------------------------------------------
// Paste the exact MetaMask wallet addresses for each role below.
// Ensure they are fully lowercased or exact copies from MetaMask.

// 1. Investigator (Assigned to "Medical & Healthcare")
const INVESTIGATOR_WALLET = '0x_PASTE_INVESTIGATOR_WALLET_HERE';

// 2. Three Admins (Required for the 2/3 Multi-Sig Threshold)
const ADMIN_1_WALLET = '0x_PASTE_ADMIN_1_WALLET_HERE';
const ADMIN_2_WALLET = '0x_PASTE_ADMIN_2_WALLET_HERE';
const ADMIN_3_WALLET = '0x_PASTE_ADMIN_3_WALLET_HERE';

// (The Whistleblower doesn't need to be registered, any wallet can submit!)

async function setupRoles() {
    console.log('🚀 Starting Role Setup...');

    try {
        // --- Setup Admins ---
        console.log('\n1️⃣ Registering 3 Global Admins...');
        const adminData = [
            { wallet_address: ADMIN_1_WALLET.toLowerCase(), public_key: 'admin1_pubkey' },
            { wallet_address: ADMIN_2_WALLET.toLowerCase(), public_key: 'admin2_pubkey' },
            { wallet_address: ADMIN_3_WALLET.toLowerCase(), public_key: 'admin3_pubkey' }
        ];

        for (const admin of adminData) {
            if (admin.wallet_address.includes('PASTE')) continue; // Skip if not updated
            await supabase.from('admin').upsert(admin, { onConflict: 'wallet_address' });
            console.log(`✅ Admin Registered: ${admin.wallet_address}`);
        }

        // --- Setup Investigator ---
        console.log('\n2️⃣ Registering Medical & Healthcare Investigator...');
        if (!INVESTIGATOR_WALLET.includes('PASTE')) {
            const investigatorData = {
                wallet_address: INVESTIGATOR_WALLET.toLowerCase(),
                name: 'Medical Chief Inspector',
                department: 'Health Intelligence',
                role: 'investigator',
                category: 'Medical & Healthcare', // Must match exact categories
                loyalty_score: 100,
                public_key: 'investigator_pubkey'
            };
            await supabase.from('investigators').upsert(investigatorData, { onConflict: 'wallet_address' });
            console.log(`✅ Investigator Registered: ${INVESTIGATOR_WALLET}`);
        }

        console.log('\n🎉 Setup Complete! You are ready to demo the multi-wallet flow!');

    } catch (error) {
        console.error('❌ Setup Failed:', error.message);
    }
}

setupRoles();

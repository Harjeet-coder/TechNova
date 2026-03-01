require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// ---------------------------------------------------------
// 🚨 HACKATHON SETUP: CONFIGURE YOUR METAMASK ACCOUNTS
// ---------------------------------------------------------
// Paste the exact MetaMask wallet addresses for each investigator below.
// Ensure they are fully lowercased or exact copies from MetaMask.

// 1. Investigators (Assigned to respective categories)
const INV_POLITICS = '0x32eCaae7B668E73b42BfB3A90D5CDc24A5740d1A';
const INV_MEDICAL = '0xA554028E46E94482410A034148A4c8048B05B6A1'; // Existing
const INV_EDUCATION = '0xa454D7d1EdE4a3b1574A04907ADd81a89608326a';
const INV_AGRICULTURE = '0x88a5703FF39D0A12699d26841912816B3F0c5A23';
const INV_FINANCE = '0x46110f9914305FE94C7A0050a3C6d9628D7275A4';
const INV_OTHER = '0xD7Bc7F3337A26eab045376F4d9Eb32687115b66B';

// 2. Three Admins (Required for the 2/3 Multi-Sig Threshold)
const ADMIN_1_WALLET = '0xdE394be3499eEA6df0eaB7d7d3954348263f106E';
const ADMIN_2_WALLET = '0x2aa4AFe14B0592b5EbB0C247c610248D58cD14c4';
const ADMIN_3_WALLET = '0x223cE90A190eB1BfE721be510d1ad6EA24F52999';

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

        // --- Setup Investigators ---
        console.log('\n2️⃣ Registering Investigators for all categories...');

        const investigators = [
            { wallet: INV_POLITICS, name: 'Political Inspector', dept: 'Gov Intelligence', category: 'Politics & Government' },
            { wallet: INV_MEDICAL, name: 'Medical Chief Inspector', dept: 'Health Intelligence', category: 'Medical & Healthcare' },
            { wallet: INV_EDUCATION, name: 'Education Integrity Officer', dept: 'Education Assessment', category: 'Educational Institutes' },
            { wallet: INV_AGRICULTURE, name: 'Environmental Supervisor', dept: 'Agri Inspectorate', category: 'Agriculture & Environment' },
            { wallet: INV_FINANCE, name: 'Financial Auditor', dept: 'Corporate Finance', category: 'Corporate Finance' },
            { wallet: INV_OTHER, name: 'General Affairs Investigator', dept: 'General Enforcement', category: 'Other Issues' }
        ];

        for (const inv of investigators) {
            if (inv.wallet.includes('PASTE')) continue; // Skip if not updated

            const investigatorData = {
                wallet_address: inv.wallet.toLowerCase(),
                name: inv.name,
                department: inv.dept,
                role: 'investigator',
                category: inv.category,
                loyalty_score: 100,
                public_key: `pubkey_${inv.wallet.substring(0, 8)}`
            };
            await supabase.from('investigators').upsert(investigatorData, { onConflict: 'wallet_address' });
            console.log(`✅ ${inv.category} Investigator Registered: ${inv.wallet}`);
        }

        console.log('\n🎉 Setup Complete! You are ready to demo the multi-wallet flow!');

    } catch (error) {
        console.error('❌ Setup Failed:', error.message);
    }
}

setupRoles();

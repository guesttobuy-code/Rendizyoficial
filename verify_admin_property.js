
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://odcgnzfremrqnvtitpcc.supabase.co';
// Using the Service Role Key found in TOKENS_E_ACESSOS_COMPLETO.md and verified via check-draft.js
const SERVICE_ROLE_KEY = 'sb_secret_Se1z5M4EM0lzUn4uXuherQ_6LX7BQ8d';

const TARGET_ID = '1e4b95b4-cfff-474f-9402-234659ac5179';

async function main() {
    console.log('🔐 Connecting as ADMIN (Service Role)...');
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    console.log(`🔍 Querying Property ID: ${TARGET_ID}`);
    // Select * to see everything, or specific fields. 'name' is likely the column, not 'title' based on previous error.
    const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', TARGET_ID)
        .single();

    if (error) {
        console.error('❌ Error querying property:', error);
        return;
    }

    if (!data) {
        console.error('❌ Property NOT FOUND even as Admin.');
        return;
    }

    console.log('✅ Property FOUND!');
    console.log(`- ID: ${data.id}`);
    console.log(`- Created At: ${data.created_at}`);
    console.log(`- Name (Column): ${data.name}`); // Assuming 'name' exists
    console.log(`- Address (Columns): ${data.address_street}, ${data.address_city}, ${data.address_state}`);

    const wd = data.wizard_data || {};
    console.log('\n📦 Wizard Data Content (JSONB):');
    console.log('---------------------------------------------------');

    // Check Content Photos
    const contentPhotos = wd.contentPhotos || {};
    console.log(`📸 [contentPhotos]:`, JSON.stringify(contentPhotos, null, 2));

    if (contentPhotos.coverPhotoId) {
        console.log(`\n✅ COVER PHOTO ID FOUND: ${contentPhotos.coverPhotoId}`);
        console.log('🎉 PERSISTENCE IS WORKING!');
    } else {
        console.log('\n⚠️ Cover Photo ID is UNDEFINED in contentPhotos.');
        // Check root just in case
        if (wd.coverPhotoId) console.log(`   (Found at root: ${wd.coverPhotoId})`);
    }

    // Check Content Type
    const contentType = wd.contentType || {};
    console.log(`\n📄 [contentType]:`, JSON.stringify(contentType, null, 2));

    // Check internal name
    if (contentType.internalName === "Test Internal Name FIXED") {
        console.log('✅ Internal Name MATCHES expected value.');
    } else {
        console.log(`⚠️ Internal Name mismatch: "${contentType.internalName}"`);
    }
}

main().catch(console.error);

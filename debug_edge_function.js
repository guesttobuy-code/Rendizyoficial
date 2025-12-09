
const { createClient } = require('@supabase/supabase-js');

// Config
const SUPABASE_URL = 'https://odcgnzfremrqnvtitpcc.supabase.co';
const SERVICE_ROLE_KEY = 'sb_secret_Se1z5M4EM0lzUn4uXuherQ_6LX7BQ8d'; // Admin Key to invoke function permissions
const TARGET_ID = '1e4b95b4-cfff-474f-9402-234659ac5179';

async function main() {
    console.log('🔌 Connecting to Supabase...');
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Payload mimicking PropertyEditWizard.tsx save
    const payload = {
        wizardData: {
            contentType: {
                internalName: "DEBUG_TEST_NAME_123",
                propertyTypeId: "loc_casa",
                accommodationTypeId: "acc_casa",
                subtipo: "entire_place",
                modalidades: ["short_term_rental", "buy_sell"],
                propertyType: "individual",
                registrationNumber: "REG-123"
            }
        }
    };

    console.log('🚀 Invoking Edge Function (PUT /properties)...');
    console.log('📦 Payload:', JSON.stringify(payload, null, 2));

    const { data: result, error } = await supabase.functions.invoke(`rendizy-server/properties/${TARGET_ID}`, {
        method: 'PUT',
        body: payload
    });

    if (error) {
        console.error('❌ Edge Function Invocation Error Object:', error);
        // Supabase JS library wraps the error.
        // If it's a non-200, 'error' is populated.
        if (error.context && error.context.json) {
            const errBody = await error.context.json();
            console.error('❌ Edge Function Error Body:', JSON.stringify(errBody, null, 2));
        }
        return;
    }

    console.log('✅ Edge Function Success!');
    console.log('📥 Response:', JSON.stringify(result, null, 2));

    console.log('\n🔍 Verifying Persistence in DB...');
    const { data: dbData, error: dbError } = await supabase
        .from('properties')
        .select('wizard_data')
        .eq('id', TARGET_ID)
        .single();

    if (dbError) {
        console.error('❌ DB Verify Failed:', dbError);
        return;
    }

    const savedType = dbData.wizard_data.contentType;
    console.log('📦 Saved contentType:', JSON.stringify(savedType, null, 2));

    if (savedType.modalidades && savedType.modalidades.length === 2) {
        console.log('🎉 SUCCESS: Modalities persisted!');
    } else {
        console.log('🔥 FAILURE: Modalities MISSING or mismatch!');
    }
}

main().catch(console.error);

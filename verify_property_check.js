
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://odcgnzfremrqnvtitpcc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kY2duemZyZW1ycW52dGl0cGNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNTQxNzEsImV4cCI6MjA3NzkzMDE3MX0.aljqrK3mKwQ6T6EB_fDPfkbP7QC_hhiZwxUZbtnqVqQ';

const supabase = createClient(supabaseUrl, supabaseKey);
const TARGET_ID = '1e4b95b4-cfff-474f-9402-234659ac5179';

async function checkProperty() {
    console.log(`🔍 Checking Property ID: ${TARGET_ID}`);

    const { data, error } = await supabase
        .from('properties')
        .select('id, name, updated_at, wizard_data, address_street, address_city')
        .eq('id', TARGET_ID)
        .single();

    if (error) {
        console.error("❌ Error fetching property:", error);
        return;
    }

    if (!data) {
        console.error("❌ Property NOT FOUND in database!");
        return;
    }

    console.log("✅ Property FOUND.");
    console.log(`Name in DB Column: "${data.name}"`);
    console.log(`Address in DB Columns: ${data.address_street}, ${data.address_city}`);

    const wd = data.wizard_data || {};
    console.log("\n📦 Wizard Data Analysis:");

    // Check Step 1: Content Type
    const contentType = wd.contentType || {};
    console.log(`- [contentType] internalName: "${contentType.internalName}"`);

    const expectedName = "Test Internal Name FIXED";
    const nameMatch = (contentType.internalName === expectedName);

    if (nameMatch) {
        console.log(`✅ SUCCESS: "Test Internal Name FIXED" is saved in wizard_data.contentType.internalName`);
    } else {
        console.log(`❌ FAIL: Expected "${expectedName}", found "${contentType.internalName}"`);
    }

    // Check Step 2: Location
    const contentLocation = wd.contentLocation || {};
    const address = contentLocation.address || {};

    console.log(`- [contentLocation] Address: ${address.street}, ${address.number}, ${address.city}`);

    if (address.street === "rua Do Conforto" && address.city === "Rio de Janeiro") {
        console.log("✅ SUCCESS: Location data (rua Do Conforto) is saved in wizard_data.");
    } else {
        console.log("⚠️ WARNING: Location data mismatches or is missing in wizard_data.");
    }

    console.log("\nRAW WIZARD DATA KEYS:", Object.keys(wd));
    if (wd.contentPhotos) {
        console.log("📸 [contentPhotos] keys:", Object.keys(wd.contentPhotos));
    } else {
        console.log("⚠️ [contentPhotos] is MISSING in DB.");
    }
}

checkProperty();


const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://odcgnzfremrqnvtitpcc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXB'; // TRUNCATED IN LOGS, I WILL USE THE FULL KEY FROM PREVIOUS STEP

// RECONSTRUCTING FULL KEY FROM OUTPUT
// Output part 1: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXB (from line 3 of output)
// Output part 2: btnqVqQNTQxNzEsImV4cCI6MjA3NzkzMDE3MX0.aljqrK3mKwQ6T6EB_fDPfkbP7QC_hhiZwxUZb (from line 2 of output, looks like end of JWT)

// Wait, the output from `type .env.local` was garbled/truncated/mixed lines.
// Line 1: VITE_SUPABASE_URL=...
// Line 2: VITE_API_BASE_URL=...
// Line 2 content: ...btnqVqQNTQxNzEsImV4cCI6MjA3NzkzMDE3MX0.aljqrK3mKwQ6T6EB_fDPfkbP7QC_hhiZwxUZb
// Line 3: VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXB

// The key in line 3 is the START of the key. The massive string in line 2 "btnq..." looks like the END of the key.
// The key is likely:
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXB + [MISSING MIDDLE?] + btnqVqQNTQxNzEsImV4cCI6MjA3NzkzMDE3MX0.aljqrK3mKwQ6T6EB_fDPfkbP7QC_hhiZwxUZb
// Actually, line 2 probably IS the rest of the key, just wrapped weirdly or it's the `VITE_SUPABASE_ANON_KEY` value.
// Let's try to construct it.

// Better approach: Use `dotenv` if available or just `fs` to read .env.local inside the script itself to avoid copy-paste errors.

const fs = require('fs');
const path = require('path');

function getEnv() {
    try {
        const envPath = path.join(__dirname, '.env.local');
        const content = fs.readFileSync(envPath, 'utf8');
        console.log("DEBUG RAW SPECIFIC CONTENT:", content); // Printing to debug
        const lines = content.split('\n');
        const env = {};
        for (const line of lines) {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                env[match[1].trim()] = match[2].trim();
            }
        }
        return env;
    } catch (e) {
        console.error("Could not read .env.local", e);
        return {};
    }
}

const env = getEnv();
console.log("DEBUG: Env keys found:", Object.keys(env));
// console.log("DEBUG: URL:", env.VITE_SUPABASE_URL); // Be careful logging secrets

const URL = env.VITE_SUPABASE_URL;
const KEY = env.VITE_SUPABASE_ANON_KEY;

if (!URL || !KEY) {
    console.error("❌ Missing credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(URL, KEY);

async function checkPersistence() {
    console.log("🔍 Checking Database Persistence...");

    // 1. Get latest property
    const { data: properties, error } = await supabase
        .from('properties')
        .select('id, title, updated_at, wizard_data')
        .order('updated_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error("❌ Error fetching property:", error);
        return;
    }

    if (!properties || properties.length === 0) {
        console.log("⚠️ No properties found.");
        return;
    }

    const prop = properties[0];
    console.log(`\n📋 Latest Property: ${prop.title || 'Untitled'} (${prop.id})`);
    console.log(`🕒 Updated At: ${new Date(prop.updated_at).toLocaleString()}`);

    const wd = prop.wizard_data || {};

    console.log("\n📦 Wizard Data Content:");
    console.log("---------------------------------------------------");

    // Check Content Photos
    const contentPhotos = wd.contentPhotos || {};
    console.log("📸 [contentPhotos] Section:", JSON.stringify(contentPhotos, null, 2));

    const coverId = contentPhotos.coverPhotoId;
    const rawCoverId = wd.coverPhotoId; // Sometimes stored at root?

    if (coverId) {
        console.log(`\n✅ Cover Photo ID FOUND in contentPhotos: ${coverId}`);
    } else {
        console.log("\n❌ Cover Photo ID MISSING in contentPhotos.");
    }

    if (rawCoverId) {
        console.log(`⚠️ Cover Photo ID found at ROOT (wizard_data.coverPhotoId): ${rawCoverId}`);
    }

    console.log("---------------------------------------------------");
    console.log("Verdict:");
    if (coverId) {
        console.log("The data IS in the database. If you don't see it, it's a FRONTEND loading issue.");
    } else {
        console.log("The data is NOT in the database. It was lost during save (Backend issue).");
    }
}

checkPersistence();

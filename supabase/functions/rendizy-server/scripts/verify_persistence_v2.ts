// @ts-nocheck
// Scripts de Verificação de Persistência (Methodology V2)
// Run with: npx ts-node scripts/verify_persistence_v2.ts

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

// Load env vars (simulate)
const SUPABASE_URL = process.env.SUPABASE_URL || "https://odcgnzfremrqnvtitpcc.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("⚠️ AVISO: SUPABASE_SERVICE_ROLE_KEY não definida no process.env!");
    console.warn("   Tentando usar token anônimo hardcoded ou falhando...");
}

const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function runTest() {
    console.log("🛡️ INICIANDO PROTOCOLO DE BLINDAGEM - IDENTITY SPOKE (V2.1 - Update Focus)");

    try {
        const TARGET_ID = "cfd4c4d3-12bb-4d4a-a855-1912f1a6caee"; // User's test ID

        console.log(`\n1️⃣ USANDO PROPRIEDADE EXISTENTE (${TARGET_ID})...`);

        // 2. SIMULATE FRONTEND UPDATE (The "Shotgun Payload")
        // Generate a random ID for internalName to prove it's a FRESH update
        const uniqueTag = "VERIFY_" + Math.floor(Math.random() * 10000);
        console.log(`\n2️⃣ SIMULANDO UPDATE FRONTEND (Tag: ${uniqueTag})...`);

        const payload = {
            contentType: {
                type: "house", // Tipo do Local
                internalName: `Rafa teste 04 [${uniqueTag}]`,
                subtype: "entire_place", // Subtipo
                modalities: ["short_term_rental", "buy_sell"] // Modalidades
            },
            amenities: []
        };

        const { data: beforeUpdate, error: fetchError } = await client.from("properties").select("wizard_data").eq("id", TARGET_ID).single();

        if (fetchError) {
            throw new Error(`Erro ao buscar propriedade alvo: ${fetchError.message}`);
        }

        console.log("   Estado Anterior:", beforeUpdate ? (typeof beforeUpdate.wizard_data === 'string' ? "STRING" : "OBJECT") : "NOT FOUND");

        const { error: updateError } = await client.from("properties").update({
            wizard_data: JSON.stringify(payload) // 🛡️ CORE FIX: Force Stringify
        }).eq("id", TARGET_ID);

        if (updateError) {
            throw new Error(`Update falhou: ${updateError.message} (${updateError.code})`);
        }
        console.log("✅ Update enviado com sucesso!");

        // 3. VERIFY PERSISTENCE
        console.log(`\n3️⃣ VERIFICANDO PERSISTÊNCIA...`);

        const { data: afterUpdate, error: readError } = await client.from("properties").select("wizard_data").eq("id", TARGET_ID).single();

        if (readError) {
            throw new Error(`Leitura falhou: ${readError.message}`);
        }

        const rawData = afterUpdate.wizard_data;
        // console.log("   Dado Bruto no Banco:", rawData);

        let parsedData = rawData;
        if (typeof rawData === 'string') {
            console.log("   📝 Dado veio como STRING (Esperado!)");
            parsedData = JSON.parse(rawData);
        } else {
            console.log("   ⚠️ Dado veio como OBJETO (Supabase client auto-parsed?)");
        }

        // 4. ASSERTIONS
        const passedName = parsedData.contentType?.internalName?.includes(uniqueTag);
        const passedType = parsedData.contentType?.type === "house";
        const passedModalities = parsedData.contentType?.modalities?.includes("buy_sell");

        console.log("\n📊 RELATÓRIO DE BLINDAGEM:");
        console.log(`   Internal Name Persistiu? ${passedName ? "✅ SIM" : "❌ NÃO"} (${parsedData.contentType?.internalName})`);
        console.log(`   Type Persistiu?          ${passedType ? "✅ SIM" : "❌ NÃO"}`);
        console.log(`   Modalities Persistiu?    ${passedModalities ? "✅ SIM" : "❌ NÃO"}`);

        if (passedName && passedType && passedModalities) {
            console.log("\n🏆 RESULTADO: PASSOU! O sistema está blindado.");
        } else {
            console.error("\n💀 RESULTADO: FALHOU! Algum dado se perdeu.");
            process.exit(1);
        }

    } catch (e) {
        console.error("\n❌ ERRO CRÍTICO NO SCRIPT:", e);
        process.exit(1);
    }
}

runTest();

#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

const SUPABASE_URL = 'https://radggsmuvtalwwktljfu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_jdyDWIytMLR8SB6-Y-ClkA_95H5onV_';

async function executeSql(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });

    const options = {
      hostname: 'radggsmuvtalwwktljfu.supabase.co',
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, status: res.statusCode, body });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  try {
    console.log('🚀 Ejecutando scripts SQL en Supabase...\n');

    // Leer schema_baterias_fv.sql
    const schemaPath = path.join(__dirname, 'schema_baterias_fv.sql');
    const setupPath = path.join(__dirname, 'SUPABASE_SETUP.sql');

    const schema = fs.readFileSync(schemaPath, 'utf8');
    const setup = fs.readFileSync(setupPath, 'utf8');

    // Dividir en statements individuales
    const splitQueries = (sql) => {
      return sql
        .split(';')
        .map(q => q.trim())
        .filter(q => q.length > 0 && !q.startsWith('--'));
    };

    console.log('📋 Script 1: schema_baterias_fv.sql');
    const schemaQueries = splitQueries(schema);
    console.log(`   Encontrados ${schemaQueries.length} statements\n`);

    for (let i = 0; i < schemaQueries.length; i++) {
      const query = schemaQueries[i] + ';';
      try {
        console.log(`   [${i + 1}/${schemaQueries.length}] Ejecutando...`);
        await executeSql(query);
        console.log(`   ✅ OK`);
      } catch (err) {
        console.error(`   ❌ Error: ${err.message}`);
      }
    }

    console.log('\n📋 Script 2: SUPABASE_SETUP.sql');
    const setupQueries = splitQueries(setup);
    console.log(`   Encontrados ${setupQueries.length} statements\n`);

    for (let i = 0; i < setupQueries.length; i++) {
      const query = setupQueries[i] + ';';
      try {
        console.log(`   [${i + 1}/${setupQueries.length}] Ejecutando...`);
        await executeSql(query);
        console.log(`   ✅ OK`);
      } catch (err) {
        console.error(`   ❌ Error: ${err.message}`);
      }
    }

    console.log('\n✨ ¡Scripts ejecutados exitosamente!');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();

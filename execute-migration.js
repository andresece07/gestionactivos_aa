#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://radggsmuvtalwwktljfu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_jdyDWIytMLR8SB6-Y-ClkA_95H5onV_';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function executeSql(sql) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });
    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    // Si exec_sql no está disponible, intentar con REST API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    return { success: true };
  }
}

async function main() {
  try {
    console.log('🚀 Ejecutando migración SQL en Supabase...\n');

    // Leer archivo de migración
    const migrationPath = path.join(__dirname, 'database', 'agregar_dias_y_estado_vida.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');

    // Dividir en statements individuales
    const splitQueries = (sql) => {
      return sql
        .split(';')
        .map(q => q.trim())
        .filter(q => q.length > 0 && !q.startsWith('--') && !q.match(/^\/\*/));
    };

    const queries = splitQueries(migrationSql);
    console.log(`📋 Migración: agregar_dias_y_estado_vida.sql`);
    console.log(`   Encontrados ${queries.length} statements\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < queries.length; i++) {
      const query = queries[i] + ';';
      try {
        console.log(`   [${i + 1}/${queries.length}] Ejecutando...`);
        await executeSql(query);
        console.log(`   ✅ OK`);
        successCount++;
      } catch (err) {
        console.error(`   ❌ Error: ${err.message}`);
        errorCount++;
      }
    }

    console.log(`\n✨ Migración completada!`);
    console.log(`   ✅ Exitosos: ${successCount}`);
    console.log(`   ❌ Errores: ${errorCount}`);

    if (errorCount === 0) {
      console.log('\n🎉 ¡Todos los cambios se aplicaron correctamente!');
    } else {
      console.log('\n⚠️  Algunos cambios generaron errores. Revisa arriba para detalles.');
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Error fatal:', err.message);
    process.exit(1);
  }
}

main();

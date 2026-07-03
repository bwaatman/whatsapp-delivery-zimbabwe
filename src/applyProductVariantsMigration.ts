import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    console.log('📋 Applying product variants migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'migrations', '015_create_product_variants.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('📝 Migration SQL:', migrationSQL);
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Error applying migration:', error);
      process.exit(1);
    }
    
    console.log('✅ Product variants migration applied successfully');
  } catch (error) {
    console.error('❌ Exception applying migration:', error);
    process.exit(1);
  }
}

applyMigration();

import { supabase } from './database';
import fs from 'fs';
import path from 'path';

async function applyMigration() {
  try {
    console.log('🚀 Applying driver order functions migration...');
    
    const migrationPath = path.join(__dirname, '..', 'migrations', '014_add_driver_order_functions.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing statement:', statement.substring(0, 100) + '...');
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
          console.error('❌ Error executing statement:', error);
          // Try direct SQL execution via REST API
          console.log('Trying direct SQL execution...');
        }
      }
    }
    
    // Try executing the entire migration via direct SQL
    console.log('📝 Executing full migration...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Error applying migration:', error);
      console.log('⚠️ Migration may need to be applied manually via Supabase dashboard');
    } else {
      console.log('✅ Migration applied successfully!');
    }
    
  } catch (error) {
    console.error('❌ Exception applying migration:', error);
  }
}

applyMigration();

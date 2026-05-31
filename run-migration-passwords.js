const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('Running password fields migration...');

    // Since we can't execute raw SQL directly, we'll update existing records
    // The password columns should be added manually through Supabase dashboard
    console.log('⚠️  Note: Please manually add password columns to the following tables in Supabase dashboard:');
    console.log('   - drivers (TEXT type)');
    console.log('   - merchants (TEXT type)');
    console.log('   - driver_registration_requests (TEXT type)');
    console.log('   - vendor_registration_requests (TEXT type)');
    console.log('');
    console.log('After adding the columns, this script will set default passwords for existing users.');
    console.log('');
    console.log('Press Enter to continue after adding the password columns...');
    
    // For now, let's try to update existing records if the columns exist
    console.log('Attempting to set default passwords for existing drivers...');
    const { data: drivers, error: driversError } = await supabase
      .from('drivers')
      .select('id, phone');
    
    if (driversError) {
      console.log('❌ Could not access drivers table (password column may not exist yet):', driversError.message);
    } else {
      console.log(`Found ${drivers.length} drivers`);
      // Try to update with password
      for (const driver of drivers) {
        const { error: updateError } = await supabase
          .from('drivers')
          .update({ password: '12345' })
          .eq('id', driver.id);
        
        if (updateError) {
          console.log(`❌ Could not update driver ${driver.id}:`, updateError.message);
        } else {
          console.log(`✅ Set default password for driver ${driver.phone}`);
        }
      }
    }

    console.log('Attempting to set default passwords for existing merchants...');
    const { data: merchants, error: merchantsError } = await supabase
      .from('merchants')
      .select('id, contact_phone');
    
    if (merchantsError) {
      console.log('❌ Could not access merchants table (password column may not exist yet):', merchantsError.message);
    } else {
      console.log(`Found ${merchants.length} merchants`);
      // Try to update with password
      for (const merchant of merchants) {
        const { error: updateError } = await supabase
          .from('merchants')
          .update({ password: '12345' })
          .eq('id', merchant.id);
        
        if (updateError) {
          console.log(`❌ Could not update merchant ${merchant.id}:`, updateError.message);
        } else {
          console.log(`✅ Set default password for merchant ${merchant.contact_phone}`);
        }
      }
    }

    console.log('✅ Migration script completed');
    console.log('⚠️  If password columns don\'t exist, please add them manually in Supabase dashboard and run this script again.');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();

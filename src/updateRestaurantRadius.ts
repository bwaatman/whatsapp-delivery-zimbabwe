import { supabase } from './database';

async function updateRestaurantDeliveryRadius() {
  try {
    console.log('🔄 Updating Restaurant category delivery radius...');

    const { data, error } = await supabase
      .from('business_categories')
      .update({ default_delivery_radius_km: 25 })
      .eq('name', 'Restaurant')
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating delivery radius:', error);
      return false;
    }

    console.log('✅ Restaurant delivery radius updated successfully:', data);
    return true;
  } catch (error) {
    console.error('❌ Exception updating delivery radius:', error);
    return false;
  }
}

updateRestaurantDeliveryRadius()
  .then(success => {
    if (success) {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    } else {
      console.log('❌ Migration failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });

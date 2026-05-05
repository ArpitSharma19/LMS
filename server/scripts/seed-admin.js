import '../config/env.js';
import { supabase } from '../config/supabase.js';
import bcrypt from 'bcryptjs';

async function seedAdmin() {
  try {
    console.log("🚀 Seeding Admin...");
    
    // Seed Admin
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@lms.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
    
    const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
    
    const { data: existingAdmin } = await supabase.from('admins').select('*').eq('email', adminEmail).single();

    if (!existingAdmin) {
      await supabase.from('admins').insert([{
        email: adminEmail,
        password: hashedAdminPassword
      }]);
      console.log(`✅ Admin created: ${adminEmail}`);
    } else {
      await supabase.from('admins').update({ password: hashedAdminPassword }).eq('id', existingAdmin.id);
      console.log(`✅ Admin updated: ${adminEmail}`);
    }

    // Seed Commission Settings
    const { data: existingSettings } = await supabase.from('commission_settings').select('*').limit(1).single();

    if (!existingSettings) {
      await supabase.from('commission_settings').insert([{
        platform_percentage: 20.00
      }]);
      console.log(`✅ Commission settings initialized to 20%`);
    } else {
      console.log(`✅ Commission settings already exist`);
    }

    console.log("✅ Seeding Complete");
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed Error:', error.message);
    process.exit(1);
  }
}

seedAdmin();

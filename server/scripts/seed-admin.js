import '../config/env.js';
import { connectDB, sequelize } from '../config/database.js';
import { Admin, CommissionSettings } from '../models/index.js';
import bcrypt from 'bcryptjs';

async function seedAdmin() {
  try {
    await connectDB();
    await sequelize.sync();
    
    // Seed Admin
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@lms.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
    
    const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
    
    const [admin, created] = await Admin.findOrCreate({
      where: { email: adminEmail },
      defaults: {
        password: hashedAdminPassword
      }
    });

    if (created) {
      console.log(`✅ Admin created: ${adminEmail}`);
    } else {
      admin.password = hashedAdminPassword;
      await admin.save();
      console.log(`✅ Admin updated: ${adminEmail}`);
    }

    // Seed Commission Settings
    const [settings, sCreated] = await CommissionSettings.findOrCreate({
      where: { id: 1 },
      defaults: {
        platformPercentage: 20.00
      }
    });

    if (sCreated) {
      console.log(`✅ Commission settings initialized to 20%`);
    } else {
      console.log(`✅ Commission settings already exist`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed Error:', error.message);
    process.exit(1);
  }
}

seedAdmin();

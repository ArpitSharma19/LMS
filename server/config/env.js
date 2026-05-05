import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env'), override: false });

// Validate Critical Environment Variables
const requiredEnv = [
  'JWT_SECRET', 
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'CLOUDINARY_NAME', 
  'CLOUDINARY_API_KEY', 
  'CLOUDINARY_SECRET_KEY'
];

requiredEnv.forEach(envVar => {
  if (!process.env[envVar]) {
    console.warn(`⚠️ CONFIG WARNING: ${envVar} is MISSING in environment!`);
  }
});

if (!process.env.JWT_SECRET || !process.env.SUPABASE_URL) {
    console.error("❌ CRITICAL: Mandatory environment variables are missing (JWT_SECRET or SUPABASE_URL).");
    if (process.env.NODE_ENV === 'production') {
      console.error("Continuing anyway to allow serverless startup...");
    } else {
      process.exit(1);
    }
}

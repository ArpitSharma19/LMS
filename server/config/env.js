import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env'), override: false });

// Validate Critical Environment Variables
const requiredEnv = [
  'JWT_SECRET', 
  'DB_HOST', 
  'DB_NAME', 
  'DB_USER', 
  'CLOUDINARY_NAME', 
  'CLOUDINARY_API_KEY', 
  'CLOUDINARY_SECRET_KEY',
  'STRIPE_SECRET_KEY'
];

requiredEnv.forEach(envVar => {
  if (!process.env[envVar]) {
    console.error(`🔥 FATAL CONFIG ERROR: ${envVar} is MISSING in .env file!`);
  }
});

if (!process.env.JWT_SECRET || !process.env.DB_HOST) {
    console.error("❌ CRITICAL: Mandatory environment variables are missing. Server cannot start.");
    process.exit(1);
}

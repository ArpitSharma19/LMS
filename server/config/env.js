import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env'), override: false });

const REQUIRED_ENV = {
  auth:       ['JWT_SECRET'],
  supabase:   ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
  stripe:     ['STRIPE_SECRET_KEY'],
  cloudinary: ['CLOUDINARY_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_SECRET_KEY'],
};

const ALL_REQUIRED = Object.values(REQUIRED_ENV).flat();

ALL_REQUIRED.forEach(key => {
  if (!process.env[key]) {
    console.warn(`⚠️  ENV missing: ${key}`);
  }
});

/**
 * Returns true if all env vars for the given service are present.
 * Use in health checks and service initialization guards.
 * @param {'auth'|'supabase'|'stripe'|'cloudinary'} service
 */
export const isEnvReady = (service) => {
  const keys = REQUIRED_ENV[service];
  if (!keys) return false;
  return keys.every(k => Boolean(process.env[k]));
};

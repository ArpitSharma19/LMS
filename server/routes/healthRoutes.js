import express from 'express';
import { supabase } from '../config/supabase.js';
import { isEnvReady } from '../config/env.js';

const healthRouter = express.Router();

healthRouter.get('/', async (req, res) => {
  const [db, stripe, cloudinary] = await Promise.all([
    checkDb(),
    checkStripe(),
    checkCloudinary(),
  ]);

  const overall = [db, stripe, cloudinary].every(s => s === 'ok') ? 'ok' : 'degraded';
  const statusCode = overall === 'ok' ? 200 : 207;

  res.status(statusCode).json({
    status: overall,
    services: { db, stripe, cloudinary },
    timestamp: new Date().toISOString(),
  });
});

healthRouter.get('/db', async (req, res) => {
  const status = await checkDb();
  res.status(status === 'ok' ? 200 : 503).json({ status });
});

healthRouter.get('/stripe', (req, res) => {
  const status = checkStripe();
  res.status(status === 'ok' ? 200 : 503).json({ status });
});

healthRouter.get('/cloudinary', (req, res) => {
  const status = checkCloudinary();
  res.status(status === 'ok' ? 200 : 503).json({ status });
});

async function checkDb() {
  if (!isEnvReady('supabase')) return 'down';
  try {
    const { error } = await supabase.from('users').select('id').limit(1);
    return error ? 'degraded' : 'ok';
  } catch {
    return 'down';
  }
}

function checkStripe() {
  return isEnvReady('stripe') ? 'ok' : 'down';
}

function checkCloudinary() {
  return isEnvReady('cloudinary') ? 'ok' : 'down';
}

export default healthRouter;

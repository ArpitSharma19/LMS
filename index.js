// Load environment variables for serverless execution
import './server/config/env.js';
import app from './server/app.js';

// Export the Express app for Vercel
export default app;

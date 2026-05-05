let stripeInstance = null;
let cloudinaryInstance = null;
let multerInstance = null;

export async function getStripe() {
  if (!stripeInstance) {
    const Stripe = (await import("stripe")).default;
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2024-06-20'
    });
  }
  return stripeInstance;
}

export async function getCloudinary() {
  if (!cloudinaryInstance) {
    const { v2 } = await import("cloudinary");
    v2.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_SECRET_KEY,
    });
    cloudinaryInstance = v2;
  }
  return cloudinaryInstance;
}

export async function getMulter() {
  if (!multerInstance) {
    const multer = (await import("multer")).default;
    const storage = multer.diskStorage({});
    multerInstance = multer({ 
      storage,
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/') || file.mimetype === 'video/mp4' || file.mimetype === 'application/pdf') {
          cb(null, true);
        } else {
          cb(new Error('Unsupported file type'), false);
        }
      }
    });
  }
  return multerInstance;
}

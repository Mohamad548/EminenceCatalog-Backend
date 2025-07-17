const crypto = require("crypto");
const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// مشخصات آپلود
const folder = 'products';
const timestamp = Math.floor(Date.now() / 1000);

// رشته‌ای که باید امضا شود:
const stringToSign = `folder=${folder}&timestamp=${timestamp}`;

// تولید signature
const signature = crypto
  .createHash('sha1')
  .update(stringToSign + process.env.CLOUDINARY_API_SECRET)
  .digest('hex');

console.log('Signature:', signature);

cloudinary.uploader.upload('./test.png', {
  folder,
  timestamp,
  api_key: process.env.CLOUDINARY_API_KEY,
  signature,
}, (error, result) => {
  if (error) {
    console.error('Upload failed:', error);
  } else {
    console.log('Upload success:', result);
  }
});

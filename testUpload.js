import cloudinary from './cloudinaryConfig.js';

async function testUpload() {
  try {
    const result = await cloudinary.uploader.upload(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1024px-React-icon.svg.png',
      { folder: 'products' }
    );
    console.log('Upload success:', result.secure_url);
  } catch (error) {
    console.error('Upload failed:', error);
  }
}

testUpload();

// sign-upload.js
import crypto from 'crypto';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { folder, timestamp } = req.body;

  if (!folder || !timestamp) {
    return res.status(400).json({ message: 'Missing required parameters' });
  }

  const secret = process.env.CLOUDINARY_API_SECRET;

  const stringToSign = `folder=${folder}&timestamp=${timestamp}${secret}`;
  const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

  res.status(200).json({ signature });
}

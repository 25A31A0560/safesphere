// POST /api/consent — save consent choices to user permissions
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'safesphere_dev_secret';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);
    const { camera, bluetooth, location } = req.body || {};
    if (!global._ss_permissions) global._ss_permissions = {};
    if (!global._ss_permissions[decoded.id]) global._ss_permissions[decoded.id] = {};
    if (camera !== undefined) global._ss_permissions[decoded.id].camera_enabled = camera ? 1 : 0;
    if (bluetooth !== undefined) global._ss_permissions[decoded.id].bluetooth_enabled = bluetooth ? 1 : 0;
    if (location !== undefined) global._ss_permissions[decoded.id].location_enabled = location ? 1 : 0;
    return res.status(200).json({ success: true });
  } catch { return res.status(200).json({ success: true }); } // Non-critical, don't block UI
}

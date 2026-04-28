// POST /api/settings/reset — restore defaults
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'safesphere_dev_secret';
const DEFAULTS = { camera_enabled:1, video_preview_enabled:0, location_enabled:1, telemetry_enabled:1, fire_detection_enabled:1, bluetooth_enabled:0, alerts_enabled:1, language:'en' };

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!global._ss_permissions) global._ss_permissions = {};
    global._ss_permissions[decoded.id] = { ...DEFAULTS };
    return res.status(200).json(global._ss_permissions[decoded.id]);
  } catch { return res.status(401).json({ error: 'Unauthorized' }); }
}

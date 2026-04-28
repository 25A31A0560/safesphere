// GET /api/settings — fetch user permissions
// POST /api/settings — update a permission key

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'safesphere_dev_secret';
if (!global._ss_permissions) global._ss_permissions = {};

const DEFAULTS = {
  camera_enabled: 1, video_preview_enabled: 0, location_enabled: 1,
  telemetry_enabled: 1, fire_detection_enabled: 1, bluetooth_enabled: 0, alerts_enabled: 1, language: 'en'
};

function getUserId(req) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.replace('Bearer ', '');
    if (!token) return null;
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.id;
  } catch { return null; }
}

export default function handler(req, res) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  if (!global._ss_permissions[userId]) global._ss_permissions[userId] = { ...DEFAULTS };

  if (req.method === 'GET') return res.status(200).json(global._ss_permissions[userId]);

  if (req.method === 'POST') {
    const ALLOWED = Object.keys(DEFAULTS);
    const updates = {};
    Object.entries(req.body || {}).forEach(([k, v]) => { if (ALLOWED.includes(k)) updates[k] = v; });
    global._ss_permissions[userId] = { ...global._ss_permissions[userId], ...updates };
    return res.status(200).json(global._ss_permissions[userId]);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

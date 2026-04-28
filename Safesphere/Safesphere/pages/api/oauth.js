import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'safesphere_dev_secret';

export default function handler(req, res) {
  const provider = req.query.provider || 'google';
  const mockUser = {
    id: uuidv4(),
    username: `${provider}_${Math.random().toString(36).slice(2, 7)}`,
    name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
    email: `user@${provider}.com`,
  };
  if (!global._ss_users) global._ss_users = [];
  global._ss_users.push({ ...mockUser, password_hash: '' });

  const token = jwt.sign({ id: mockUser.id, username: mockUser.username }, JWT_SECRET, { expiresIn: '7d' });
  // Redirect to dashboard — dashboard.html reads token from URL param and saves to localStorage
  const userParam = encodeURIComponent(JSON.stringify(mockUser));
  return res.redirect(302, `/dashboard?token=${token}&user=${userParam}`);
}

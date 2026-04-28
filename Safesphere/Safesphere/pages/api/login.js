import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'safesphere_dev_secret';

// Seed demo user on cold start
if (!global._ss_users) {
  global._ss_users = [
    { id: '1', username: 'demo', name: 'Demo User', email: 'demo@safesphere.ai', phone: '+91 9876543210', password_hash: bcrypt.hashSync('demo123', 10) }
  ];
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  const user = global._ss_users.find(u => u.username === username);
  if (!user || !(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ error: 'Invalid username or password' });
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  return res.status(200).json({ token, user: { id: user.id, username: user.username, name: user.name, email: user.email } });
}

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'safesphere_dev_secret';
if (!global._ss_users) global._ss_users = [];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { username, password, name, email, phone } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  if (global._ss_users.find(u => u.username === username)) return res.status(409).json({ error: 'Username already taken' });
  const user = { id: uuidv4(), username, name: name || username, email: email || '', phone: phone || '', password_hash: await bcrypt.hash(password, 10) };
  global._ss_users.push(user);
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  return res.status(201).json({ token, user: { id: user.id, username: user.username, name: user.name, email: user.email } });
}

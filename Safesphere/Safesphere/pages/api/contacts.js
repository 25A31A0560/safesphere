// GET/POST/PUT/DELETE /api/contacts
// Pre-seeded with emergency numbers only — no family contacts
import { v4 as uuidv4 } from 'uuid';

if (!global._ss_contacts) {
  global._ss_contacts = [
    { contact_id: uuidv4(), name: 'Emergency Services', phone: '112', email: '', type: 'emergency' },
    { contact_id: uuidv4(), name: 'Ambulance / Medical Emergency', phone: '108', email: '', type: 'hospital' },
    { contact_id: uuidv4(), name: 'Police', phone: '100', email: '', type: 'emergency' },
    { contact_id: uuidv4(), name: 'Fire Brigade', phone: '101', email: '', type: 'fire_station' },
    { contact_id: uuidv4(), name: 'Disaster Management', phone: '1078', email: '', type: 'emergency' },
    { contact_id: uuidv4(), name: 'Women Helpline', phone: '1091', email: '', type: 'emergency' },
    { contact_id: uuidv4(), name: 'Child Helpline', phone: '1098', email: '', type: 'emergency' },
  ];
}

export default function handler(req, res) {
  if (req.method === 'GET') return res.status(200).json({ contacts: global._ss_contacts });

  if (req.method === 'POST') {
    const { name, phone, email, type } = req.body || {};
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const contact = { contact_id: uuidv4(), name, phone: phone || '', email: email || '', type: type || 'family' };
    global._ss_contacts.push(contact);
    return res.status(201).json({ contact });
  }

  const { id } = req.query;

  if (req.method === 'PUT') {
    const idx = global._ss_contacts.findIndex(c => c.contact_id === id);
    if (idx === -1) return res.status(404).json({ error: 'Contact not found' });
    global._ss_contacts[idx] = { ...global._ss_contacts[idx], ...req.body };
    return res.status(200).json({ contact: global._ss_contacts[idx] });
  }

  if (req.method === 'DELETE') {
    global._ss_contacts = global._ss_contacts.filter(c => c.contact_id !== id);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

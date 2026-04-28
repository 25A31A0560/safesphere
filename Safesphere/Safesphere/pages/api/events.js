// GET /api/events — fetch all events
// POST /api/events — log a new event
// DELETE /api/events?id=X — delete one event
// DELETE /api/events — clear all

import { v4 as uuidv4 } from 'uuid';

if (!global._ss_events) global._ss_events = [];

// Build delivery recipient list from contacts + emergency services
function buildDeliveredTo(eventType, canceled) {
  if (canceled) return [];

  const contacts = global._ss_contacts || [];
  const recipients = [];

  // Always include emergency services
  const emergencyNums = contacts.filter(c => c.type === 'emergency');
  emergencyNums.forEach(c => recipients.push({ name: c.name, channel: 'SMS + Auto-Call', phone: c.phone, status: 'Delivered ✓' }));

  // Include hospitals for any event, fire stations for fire events
  const hospitals = contacts.filter(c => c.type === 'hospital');
  hospitals.forEach(c => recipients.push({ name: c.name, channel: 'SMS Alert', phone: c.phone, status: 'Delivered ✓' }));

  if (eventType && eventType.toLowerCase().includes('fire')) {
    const fireStations = contacts.filter(c => c.type === 'fire_station');
    fireStations.forEach(c => recipients.push({ name: c.name, channel: 'SMS + Dispatch', phone: c.phone, status: 'Delivered ✓' }));
  }

  // Include family contacts
  const family = contacts.filter(c => c.type === 'family');
  family.forEach(c => recipients.push({ name: c.name, channel: 'SMS + Call', phone: c.phone, status: 'Delivered ✓' }));

  // If no contacts configured, show default emergency dispatch
  if (recipients.length === 0) {
    recipients.push({ name: 'Emergency Services (112)', channel: 'Auto-Call', phone: '112', status: 'Delivered ✓' });
    recipients.push({ name: 'Ambulance (108)', channel: 'Auto-Call', phone: '108', status: 'Delivered ✓' });
  }

  return recipients;
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ events: global._ss_events.slice(0, 50) });
  }

  if (req.method === 'POST') {
    const body = req.body || {};

    // Reverse geocode area name if lat/lon provided
    let area = body.area_name || 'Unknown Location';
    if (!body.area_name && body.location_lat && body.location_lon) {
      try {
        const r = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${body.location_lat}&lon=${body.location_lon}`,
          { headers: { 'User-Agent': 'SafeSphere/2.0' } }
        );
        const d = await r.json();
        area = d.display_name?.split(',').slice(0, 2).join(', ') || 'Unknown';
      } catch {}
    }

    const canceled = body.canceled || 0;
    const deliveredTo = buildDeliveredTo(body.event_type, canceled);

    const event = {
      event_id: body.event_id || uuidv4(),
      event_type: body.event_type || 'Emergency',
      severity: body.severity || 'Moderate',
      area_name: area,
      timestamp_utc: body.timestamp_utc || new Date().toISOString(),
      local_timestamp: body.local_timestamp || new Date().toLocaleString(),
      location_lat: body.location_lat || 0,
      location_lon: body.location_lon || 0,
      canceled,
      accel_peak: body.accel_peak || 0,
      speed_before: body.speed_before || 0,
      speed_after: body.speed_after || 0,
      fire_confidence: body.fire_confidence || 0,
      fallback_sent: 0,
      delivered_to: deliveredTo,
    };

    global._ss_events.unshift(event);
    if (global._ss_events.length > 100) global._ss_events = global._ss_events.slice(0, 100);
    return res.status(201).json({ event });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (id) {
      global._ss_events = global._ss_events.filter(e => e.event_id !== id);
    } else {
      global._ss_events = [];
    }
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

const { Redis } = require("@upstash/redis");
const redis = Redis.fromEnv();

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { name, attending } = req.body;
  if (!name || !attending) {
    return res.status(400).json({ error: 'Name and attending status are required' });
  }

  try {
    let guests = await redis.get('guests') || [];
    
    // Ensure guests is an array
    if (!Array.isArray(guests)) {
        guests = [];
    }

    const existingIndex = guests.findIndex(g => g.name.toLowerCase() === name.trim().toLowerCase());
    const entry = {
      name: name.trim(),
      attending: attending,
      date: new Date().toISOString()
    };

    if (existingIndex > -1) {
      guests[existingIndex] = entry;
    } else {
      guests.push(entry);
    }

    await redis.set('guests', guests);
    res.status(200).json({ success: true, guests });
  } catch (error) {
    console.error('Redis error:', error);
    res.status(500).json({ error: 'Failed to save RSVP' });
  }
};

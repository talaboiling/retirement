const { Redis } = require("@upstash/redis");
const redis = Redis.fromEnv();

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const guests = await redis.get('guests') || [];
    
    if (!Array.isArray(guests) || guests.length === 0) {
      return res.status(404).send('No guests found');
    }

    let csv = 'Name,Attending,RSVP Date\n';
    guests.forEach(g => {
      const name = g.name ? g.name.replace(/"/g, '""') : '';
      const status = g.attending === 'yes' ? 'Yes' : 'No';
      const date = g.date ? new Date(g.date).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }) : '';
      csv += `"${name}","${status}","${date}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=birthday_guest_list.csv');
    res.status(200).send(csv);
  } catch (error) {
    console.error('Redis error:', error);
    res.status(500).json({ error: 'Failed to generate CSV' });
  }
};

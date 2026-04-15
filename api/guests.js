const { Redis } = require("@upstash/redis");
const redis = Redis.fromEnv();

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const guests = await redis.get('guests') || [];
    res.status(200).json(guests);
  } catch (error) {
    console.error('Redis error:', error);
    res.status(500).json({ error: 'Failed to fetch guests' });
  }
};

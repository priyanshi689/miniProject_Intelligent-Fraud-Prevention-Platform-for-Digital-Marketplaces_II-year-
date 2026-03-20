const { getRedisClient } = require('../config/redis.config');
const CACHE_TTL = 300;
const cacheSet = async (key, value, ttl = CACHE_TTL) => {
  try { await getRedisClient()?.setEx(key, ttl, JSON.stringify(value)); } catch(e) {}
};
const cacheGet = async (key) => {
  try {
    const d = await getRedisClient()?.get(key);
    return d ? JSON.parse(d) : null;
  } catch { return null; }
};
const cacheDel = async (key) => { try { await getRedisClient()?.del(key); } catch(e) {} };
module.exports = { cacheSet, cacheGet, cacheDel };

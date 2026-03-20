const { buildEntityGraph, detectFraudRings } = require('../services/graphService');
const { cacheSet, cacheGet } = require('../services/redisService');

const getUserGraph = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { depth = 2 } = req.query;
    const cacheKey = `graph:${userId}:${depth}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json({ success: true, data: cached, source: 'cache' });

    const graph = await buildEntityGraph(userId, Number(depth));
    await cacheSet(cacheKey, graph, 120);
    res.json({ success: true, data: graph });
  } catch (err) { next(err); }
};

const getFraudRings = async (req, res, next) => {
  try {
    const cached = await cacheGet('fraud:rings');
    if (cached) return res.json({ success: true, data: cached });
    const rings = await detectFraudRings();
    await cacheSet('fraud:rings', rings, 300);
    res.json({ success: true, data: rings, count: rings.length });
  } catch (err) { next(err); }
};

module.exports = { getUserGraph, getFraudRings };

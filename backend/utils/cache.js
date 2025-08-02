// backend/utils/cache.js

const cache = {};

function getCache(key) {
  const entry = cache[key];
  if (!entry) return null;

  const now = Date.now();
  if (now - entry.timestamp > entry.ttl) {
    delete cache[key];
    return null;
  }

  return entry.data;
}

function setCache(key, data, ttl = 60000) {
  cache[key] = {
    data,
    ttl,
    timestamp: Date.now()
  };
}

module.exports = { getCache, setCache };

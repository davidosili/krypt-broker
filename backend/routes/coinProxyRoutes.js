// backend/routes/coinProxyRoutes.js
const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const { getCache, setCache } = require('../utils/cache');

// ✅ Top 100 coins by market cap (cached for 60s)
router.get('/markets', async (req, res) => {
  const cacheKey = 'markets';
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    const cgRes = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1'
    );
    const data = await cgRes.json();
    setCache(cacheKey, data, 60_000); // 60s
    res.json(data);
  } catch (err) {
    console.error('❌ Proxy fetch failed:', err);
    res.status(500).json({ message: 'Failed to fetch data from CoinGecko' });
  }
});

// ✅ Single coin info by Coin ID
router.get('/coin/:id', async (req, res) => {
  const { id } = req.params;
  const cacheKey = `coin-${id}`; // ✅ Define the cache key
  const cached = getCache(cacheKey);

  if (cached) return res.json(cached); // ✅ Return from cache if valid

  try {
    const cgRes = await fetch(`https://api.coingecko.com/api/v3/coins/${id}`);
    const data = await cgRes.json();

    setCache(cacheKey, data, 60_000); // ✅ Cache for 60 seconds
    res.json(data);
  } catch (err) {
    console.error(`❌ Failed to fetch coin ${id}:`, err);
    res.status(500).json({ message: `Failed to fetch coin ${id}` });
  }
});


// ✅ Coin price for multiple ids (cached per id for 60s)
router.get('/price', async (req, res) => {
  const { ids, vs_currencies = 'usd' } = req.query;
  const idList = ids.split(',');
  const result = {};

  for (const id of idList) {
    const cacheKey = `price-${id}-${vs_currencies}`;
    const cached = getCache(cacheKey);
    if (cached) {
      result[id] = cached[id];
      continue;
    }

    try {
      const cgRes = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=${vs_currencies}`
      );
      const data = await cgRes.json();
      result[id] = data[id];
      setCache(cacheKey, data, 60_000); // 60s
    } catch (err) {
      console.error(`❌ Price fetch failed for ${id}:`, err);
    }
  }

  res.json(result);
});

// ✅ Market chart (7-day price history) for a coin (cached for 1 hour)
router.get('/chart/:id', async (req, res) => {
  const { id } = req.params;
  const { vs_currency = 'usd', days = 7 } = req.query;
  const cacheKey = `chart-${id}-${vs_currency}-${days}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=${vs_currency}&days=${days}`
    );
    const data = await response.json();
    setCache(cacheKey, data, 60 * 60 * 1000); // 1 hour
    res.json(data);
  } catch (err) {
    console.error(`❌ Failed to fetch market chart for ${id}: ${err.message}`);
    res.status(500).json({ message: `Failed to fetch market chart for ${id}.` });
  }
});

module.exports = router;

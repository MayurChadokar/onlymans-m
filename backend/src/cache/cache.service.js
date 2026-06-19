const redisClient = require('../config/redis');
const logger = require('../config/logger');

/**
 * Get cached data by key
 * @param {string} key - Cache key
 * @returns {Promise<any|null>} Parsed JSON data or null
 */
const get = async (key) => {
  try {
    const data = await redisClient.get(key);
    if (!data) return null;
    return JSON.parse(data);
  } catch (error) {
    logger.error(`Cache GET error for key "${key}": ${error.message}`);
    return null;
  }
};

/**
 * Set data in cache with TTL
 * @param {string} key - Cache key
 * @param {any} data - Data to cache (will be JSON stringified)
 * @param {number} ttlSeconds - Time to live in seconds
 */
const set = async (key, data, ttlSeconds) => {
  try {
    const serialized = JSON.stringify(data);
    if (ttlSeconds) {
      await redisClient.set(key, serialized, 'EX', ttlSeconds);
    } else {
      await redisClient.set(key, serialized);
    }
  } catch (error) {
    logger.error(`Cache SET error for key "${key}": ${error.message}`);
  }
};

/**
 * Delete a specific cache key
 * @param {string} key - Cache key to delete
 */
const del = async (key) => {
  try {
    await redisClient.del(key);
  } catch (error) {
    logger.error(`Cache DEL error for key "${key}": ${error.message}`);
  }
};

/**
 * Delete all keys matching a pattern (e.g., "admin:users:*")
 * Uses SCAN to avoid blocking Redis
 * @param {string} pattern - Glob pattern to match keys
 */
const delPattern = async (pattern) => {
  try {
    let cursor = '0';
    do {
      const [nextCursor, keys] = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length > 0) {
        await redisClient.del(...keys);
        logger.debug(`Cache invalidated ${keys.length} keys matching "${pattern}"`);
      }
    } while (cursor !== '0');
  } catch (error) {
    logger.error(`Cache DEL_PATTERN error for pattern "${pattern}": ${error.message}`);
  }
};

/**
 * Cache-aside (Read-through) wrapper
 * If key exists in cache, return cached data.
 * Otherwise, call fetchFn, cache result, and return it.
 * @param {string} key - Cache key
 * @param {number} ttlSeconds - TTL in seconds
 * @param {Function} fetchFn - Async function to fetch fresh data
 * @returns {Promise<any>} Cached or freshly fetched data
 */
const wrap = async (key, ttlSeconds, fetchFn) => {
  try {
    const cached = await get(key);
    if (cached !== null) {
      logger.debug(`Cache HIT: "${key}"`);
      return cached;
    }

    logger.debug(`Cache MISS: "${key}"`);
    const freshData = await fetchFn();
    await set(key, freshData, ttlSeconds);
    return freshData;
  } catch (error) {
    logger.error(`Cache WRAP error for key "${key}": ${error.message}`);
    // Fallback: always try to return fresh data even if cache fails
    return await fetchFn();
  }
};

module.exports = {
  get,
  set,
  del,
  delPattern,
  wrap,
};

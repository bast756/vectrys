/**
 * VECTRYS — Cache Redis v4+
 *
 * Degradation gracieuse : si Redis est indisponible,
 * l'app continue sans cache (pas de crash).
 *
 * @version 1.0.0
 */

import { createClient } from 'redis';
import { Logger } from './logger.js';

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    if (!process.env.REDIS_URL) {
      Logger.warn('Cache', 'REDIS_URL non defini, cache desactive');
      return;
    }

    try {
      this.client = createClient({ url: process.env.REDIS_URL });
      this.client.on('error', () => { this.isConnected = false; });
      this.client.on('connect', () => { this.isConnected = true; });
      await this.client.connect();
      Logger.info('Cache', 'Connecte a Redis');
    } catch {
      Logger.warn('Cache', 'Redis indisponible, continue sans cache');
    }
  }

  async get(key) {
    if (!this.isConnected) return null;
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch { return null; }
  }

  async set(key, value, ttlSeconds = 3600) {
    if (!this.isConnected) return;
    try {
      await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
    } catch { /* silencieux */ }
  }

  async del(key) {
    if (!this.isConnected) return;
    try { await this.client.del(key); } catch { /* silencieux */ }
  }
}

export const cache = new CacheService();

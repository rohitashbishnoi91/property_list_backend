import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config();
class CacheService {
    private client;

    constructor() {
        this.client = createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379'
        });

        this.client.on('error', (err) => console.error('Redis Client Error:', err));
        this.client.connect().catch(console.error);
    }

    async get(key: string): Promise<string | null> {
        try {
            return await this.client.get(key);
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }

    async set(key: string, value: string, expirySeconds?: number): Promise<void> {
        try {
            if (expirySeconds) {
                await this.client.set(key, value, { EX: expirySeconds });
            } else {
                await this.client.set(key, value);
            }
        } catch (error) {
            console.error('Cache set error:', error);
        }
    }

    async del(key: string): Promise<void> {
        try {
            await this.client.del(key);
        } catch (error) {
            console.error('Cache delete error:', error);
        }
    }

    async clearPattern(pattern: string): Promise<void> {
        try {
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(keys);
            }
        } catch (error) {
            console.error('Cache clear pattern error:', error);
        }
    }
}

export const cacheService = new CacheService(); 
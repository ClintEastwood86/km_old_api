import { inject, injectable } from 'inversify';
import { ICacheService } from './cache.service.interface';
import { TYPES } from '../types';
import { IConfigService } from '../configs/config.service.interface';
import { createClient, RedisClientType } from 'redis';
import { ILoggerService } from '../logger/logger.service.interface';

@injectable()
export class CacheService implements ICacheService {
	private client: RedisClientType;

	constructor(
		@inject(TYPES.IConfigService) config: IConfigService,
		@inject(TYPES.ILoggerService) private logger: ILoggerService
	) {
		const redisUrl = config.get('REDIS');
		if (!redisUrl) {
			logger.fatal('URL подключения Redis не найдено в .env');
		}
		this.client = createClient({ url: redisUrl });
		this.client.on('error', (err) => {
			logger.error(`[Redis] ${err.message}`);
		});
	}

	async get<T>(key: string): Promise<T | null> {
		const result = await this.client.get(key);
		return result && JSON.parse(result);
	}

	async set<T>(key: string, value: T, ttl = 60000): Promise<void> {
		await this.client.set(key, JSON.stringify(value), { expiration: { type: 'PX', value: ttl } });
	}

	async connect(): Promise<void> {
		await this.client.connect();
		this.logger.log('[Redis] Сервис кэширования подключен');
	}
}

import { inject, injectable } from 'inversify';
import { IBonusRepository } from './bonus.repository.interface';
import { Bonus, Holidays, Prisma } from '@prisma/client';
import { BonusCreateDto } from './dto/bonus-create.dto';
import { TYPES } from '../types';
import { CommonDatabase } from '../database/common.database';
import { ILoggerService } from '../logger/logger.service.interface';

@injectable()
export class BonusRepository implements IBonusRepository {
	constructor(
		@inject(TYPES.CommonDatabase) private database: CommonDatabase,
		@inject(TYPES.ILoggerService) private logger: ILoggerService
	) {}

	async create({ expiries, userId, multiplier }: BonusCreateDto, adminId: number): Promise<Bonus | null> {
		try {
			return await this.database.client.bonus.create({ data: { expiries, multiplier, userModelId: userId, adminId } });
		} catch (error) {
			error instanceof Error && this.logger.error(error.message);
			return null;
		}
	}

	async getActiveBonuses(userId: number): Promise<Bonus[]> {
		return await this.database.client.bonus.findMany({ where: { userModelId: userId, expiries: { gte: new Date() } } });
	}

	async getCommonMultiplier(userId: number): Promise<number | null>;
	async getCommonMultiplier(email: string): Promise<number | null>;
	async getCommonMultiplier(emailOrId: string | number): Promise<number | null> {
		const where: Prisma.UserModelWhereUniqueInput = typeof emailOrId == 'number' ? { id: emailOrId } : { email: emailOrId };
		const user = await this.database.client.userModel.findUnique({ where });

		if (!user) {
			return null;
		}
		const bonuses = await this.getActiveBonuses(user.id);
		let mult: number = bonuses.reduce<number>((mult, bonus) => {
			return mult + bonus.multiplier;
		}, 0);
		const holidayBonus = await this.getHolidaysBonus();
		mult += holidayBonus || 1;
		const bonusesLength = bonuses.length + (holidayBonus ? 1 : 0);
		return Number((bonusesLength > 1 ? mult * 0.9 ** bonuses.length : mult).toFixed(2));
	}

	async getHolidays(): Promise<Holidays[]> {
		return await this.database.client.holidays.findMany({ orderBy: { start: 'asc' } });
	}

	private async getHolidaysBonus(): Promise<number | null> {
		const now = new Date();
		return (await this.database.client.holidays.findFirst({ where: { start: { lte: now }, end: { gte: now } } }))?.bonus || null;
	}
}

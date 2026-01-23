import { inject, injectable } from 'inversify';
import { TYPES } from '../types';
import 'reflect-metadata';
import { IRanksRepository } from './ranks.repository.interface';
import { PointsHistoryItem, Prisma, Rank } from '@prisma/client';
import { AddPointsWithoutTemplate, AddPointsWithTemplate } from './ranks.service.interface';
import { CommonDatabase } from '../database/common.database';
import { RankCreateDto } from './dto/rank-create.dto';
import { ILoggerService } from '../logger/logger.service.interface';

@injectable()
export class RanksRepository implements IRanksRepository {
	constructor(
		@inject(TYPES.CommonDatabase) private database: CommonDatabase,
		@inject(TYPES.ILoggerService) private logger: ILoggerService
	) {}

	async create({ name, points, awardId }: RankCreateDto): Promise<Rank | null> {
		try {
			return await this.database.client.rank.create({ data: { name, points, awardId } });
		} catch (error) {
			return null;
		}
	}

	async update(id: number, { name, points, awardId }: RankCreateDto): Promise<Rank | null> {
		try {
			return await this.database.client.rank.update({
				where: { id },
				data: { name, points, awardId: awardId ?? null }
			});
		} catch (error) {
			return null;
		}
	}

	async findRankByAwardId(awardId: number): Promise<Rank | null> {
		try {
			return await this.database.client.rank.findFirst({ where: { awardId } });
		} catch (error) {
			return null;
		}
	}

	async findFirstRankByLtPoints(userPoints: number): Promise<Rank | null> {
		return await this.database.client.rank.findFirst({
			where: { points: { lte: userPoints } },
			orderBy: { points: 'desc' },
			take: 1
		});
	}

	async findRankById(id: number): Promise<Rank | null> {
		try {
			return await this.database.client.rank.findUnique({ where: { id } });
		} catch (error) {
			return null;
		}
	}

	async findAllRanks(): Promise<Rank[] | null> {
		return this.database.client.rank.findMany();
	}

	async getUserHistoryByUserId(
		id: number,
		options?: Partial<Pick<Prisma.PointsHistoryItemAggregateArgs, 'take' | 'skip'>>
	): Promise<PointsHistoryItem[]> {
		return await this.database.client.pointsHistoryItem.findMany({
			where: { userModelId: id },
			skip: options ? options.skip ?? undefined : undefined,
			take: options ? options.take ?? undefined : undefined,
			orderBy: { pointsAddedAt: 'desc' }
		});
	}

	async findMaxRank(): Promise<Rank | null> {
		return await this.database.client.rank.findFirst({ orderBy: { points: 'desc' } });
	}

	async findRankByName(name: string): Promise<Rank | null> {
		return await this.database.client.rank.findFirst({ where: { name } });
	}

	async addRecordInHistory(
		userId: number,
		options: AddPointsWithoutTemplate & { multiplier: number },
		isTemplate: false
	): Promise<PointsHistoryItem | null>;
	async addRecordInHistory(
		userId: number,
		options: AddPointsWithTemplate & { multiplier: number },
		isTemplate: true
	): Promise<PointsHistoryItem | null>;
	async addRecordInHistory(
		userId: number,
		options: (AddPointsWithoutTemplate | AddPointsWithTemplate) & { multiplier: number },
		isTemplate: boolean
	): Promise<PointsHistoryItem | null> {
		try {
			if (isTemplate) {
				return await this.database.client.pointsHistoryItem.create({
					data: {
						userModelId: userId,
						pointsItemId: (options as AddPointsWithTemplate).category,
						userMultiplier: options.multiplier
					}
				});
			} else {
				const { logName: name, points: addPoints } = options as AddPointsWithoutTemplate;
				return await this.database.client.pointsHistoryItem.create({
					data: {
						userModelId: userId,
						addPoints,
						name,
						userMultiplier: options.multiplier
					}
				});
			}
		} catch (error) {
			return null;
		}
	}
}

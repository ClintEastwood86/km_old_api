import { PointsHistoryItem, Prisma, Rank } from '@prisma/client';
import { AddPointsWithoutTemplate, AddPointsWithTemplate } from './ranks.service.interface';
import { RankCreateDto } from './dto/rank-create.dto';

export interface IRanksRepository {
	create(dto: RankCreateDto): Promise<Rank | null>;
	update(id: number, dto: RankCreateDto): Promise<Rank | null>;
	findMaxRank(): Promise<Rank | null>;
	findRankByName(name: string): Promise<Rank | null>;
	findRankById(id: number): Promise<Rank | null>;
	findAllRanks(): Promise<Rank[] | null>;
	findRankByAwardId(awardId: number): Promise<Rank | null>;
	findFirstRankByLtPoints(userPoints: number): Promise<Rank | null>;
	addRecordInHistory(
		userId: number,
		options: AddPointsWithoutTemplate & { multiplier: number },
		isTemplate: false
	): Promise<PointsHistoryItem | null>;
	addRecordInHistory(
		userId: number,
		options: AddPointsWithTemplate & { multiplier: number },
		isTemplate: true
	): Promise<PointsHistoryItem | null>;
	getUserHistoryByUserId(
		id: number,
		options?: Partial<Pick<Prisma.PointsHistoryItemAggregateArgs, 'take' | 'skip'>>
	): Promise<PointsHistoryItem[]>;
}

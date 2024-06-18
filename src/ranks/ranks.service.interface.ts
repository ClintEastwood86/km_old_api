import { PointsHistoryItem, Rank } from '@prisma/client';
import { HTTPError } from '../errors/http-error';
import { Prisma } from '@prisma/client';
import { PointsItemCategory } from '../pointsItems/pointsItem.enum';
import { RankCreateDto } from './dto/rank-create.dto';

export interface AddPointsWithTemplate {
	email: string;
	useMultiplier: boolean;
	category: PointsItemCategory;
}

export interface AddPointsWithoutTemplate {
	email: string;
	useMultiplier: boolean;
	logName: string;
	points: number;
}

export interface IRanksService {
	create(dto: RankCreateDto): Promise<Rank | HTTPError>;
	update(id: number, dto: RankCreateDto): Promise<Rank | HTTPError>;
	addPoints(options: AddPointsWithoutTemplate): Promise<number | HTTPError>;
	addPoints(options: AddPointsWithTemplate): Promise<number | HTTPError>;
	getRank(id: number): Promise<Rank | HTTPError>;
	addPointsToSubscribedUsers(): Promise<void>;
	getAllRanks(): Promise<Rank[] | HTTPError>;
	getHistory(
		email: string,
		options?: Partial<Pick<Prisma.PointsHistoryItemAggregateArgs, 'take' | 'skip'>>
	): Promise<PointsHistoryItem[] | HTTPError>;
}

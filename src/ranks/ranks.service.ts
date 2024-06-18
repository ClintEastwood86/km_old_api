import { inject, injectable } from 'inversify';
import { AddPointsWithTemplate, AddPointsWithoutTemplate, IRanksService } from './ranks.service.interface';
import 'reflect-metadata';
import { TYPES } from '../types';
import { IUsersRepository } from '../users/users.repository.interface';
import { HTTPError } from '../errors/http-error';
import { HttpStatus } from '../helpers/http-status';
import { AwardCategory, PointsHistoryItem, Prisma, Rank, UserModel } from '@prisma/client';
import { IRanksRepository } from './ranks.repository.interface';
import { ILoggerService } from '../logger/logger.service.interface';
import { HTTPErrorConstructor } from '../helpers/http-error-constructor';
import { IAwardsService } from '../awards/awards.service.interface';
import { PointsItemRepository } from '../pointsItems/pointsItem.repository';
import { RankCreateDto } from './dto/rank-create.dto';
import { PointsItemCategory } from '../pointsItems/pointsItem.enum';
import { IBonusRepository } from '../bonus/bonus.repository.interface';

@injectable()
export class RanksService implements IRanksService {
	constructor(
		@inject(TYPES.ILoggerService) private logger: ILoggerService,
		@inject(TYPES.IUsersRepository) private usersRepository: IUsersRepository,
		@inject(TYPES.IRanksRepository) private ranksRepository: IRanksRepository,
		@inject(TYPES.IBonusRepository) private bonusRepository: IBonusRepository,
		@inject(TYPES.IAwardsService) private awardsService: IAwardsService,
		@inject(TYPES.IPointsItemRepository) private pointsItemRepository: PointsItemRepository
	) {}

	async create(dto: RankCreateDto): Promise<Rank | HTTPError> {
		const checkResult = await this.preChangedCheck(dto);
		if (checkResult instanceof Error) {
			return checkResult;
		}
		const rank = await this.ranksRepository.create(dto);
		if (!rank) {
			return new HTTPError(HttpStatus.INTERNAL_SERVER_ERROR, 'create', 'Ошибка в базе данных', {
				error: `Произошла ошибка при создании звания, попробуйте позже`
			});
		}
		this.logger.log(`[RanksService] Создано новое звание ${dto.name}`);
		return rank;
	}

	async update(id: number, dto: RankCreateDto): Promise<Rank | HTTPError> {
		const existedRank = await this.ranksRepository.findRankById(id);
		if (!existedRank) {
			return new HTTPError(HttpStatus.NOT_FOUND, 'update', 'Не найдено', { error: `Звание с id ${id} не найдено` });
		}
		const checkResult = await this.preChangedCheck(dto, existedRank.awardId);
		if (checkResult instanceof Error) {
			return checkResult;
		}
		const rank = await this.ranksRepository.update(id, dto);
		if (!rank) {
			return new HTTPError(HttpStatus.INTERNAL_SERVER_ERROR, 'create', 'Ошибка в базе данных', {
				error: `Произошла ошибка при создании звания, попробуйте позже`
			});
		}
		this.logger.log(`[RanksService] Звание с id ${id} было изменено`);
		return rank;
	}

	async getHistory(
		email: string,
		options?: Partial<Pick<Prisma.PointsHistoryItemAggregateArgs, 'take' | 'skip'>>
	): Promise<HTTPError | PointsHistoryItem[]> {
		const user = await this.usersRepository.findUnique(email);
		if (!user) {
			return HTTPErrorConstructor.userNotFoundError(email);
		}
		const history = await this.ranksRepository.getUserHistoryByUserId(user.id, options);
		if (!history.length) {
			return new HTTPError(HttpStatus.NOT_FOUND, 'getHistory', 'Не найдено', { error: 'В таблице нет записей' });
		}
		return history;
	}

	async addPoints(options: AddPointsWithoutTemplate): Promise<number | HTTPError>;
	async addPoints(options: AddPointsWithTemplate): Promise<number | HTTPError>;
	async addPoints(options: AddPointsWithoutTemplate | AddPointsWithTemplate): Promise<number | HTTPError> {
		const error = HTTPErrorConstructor.userNotFoundError(options.email);
		const user = await this.usersRepository.findUnique(options.email);
		if (!user) {
			return error;
		}

		const multiplier = (await this.bonusRepository.getCommonMultiplier(user.id)) || 1;
		let points: number;
		if (this.isTemplateOptions(options)) {
			const template = await this.pointsItemRepository.getById(options.category);
			if (!template) {
				this.logger.warn(`[RanksService] Шаблон с id ${options.category} не найден`);
				return new HTTPError(HttpStatus.NOT_FOUND, 'addPoints', 'Не найдено', {
					error: `Шаблон с id ${options.category} не найден`
				});
			}
			points = options.useMultiplier ? template.addPoints * multiplier : template.addPoints;
			this.ranksRepository.addRecordInHistory(user.id, { multiplier: options.useMultiplier ? multiplier : 1, ...options }, true);
		} else {
			points = options.useMultiplier ? options.points * multiplier : options.points;
			this.ranksRepository.addRecordInHistory(user.id, { multiplier: options.useMultiplier ? multiplier : 1, ...options }, false);
		}
		points = Math.ceil(points);
		const nextRank = await this.checkForRankPromotion(user, user.userPoints + points);
		const updatedUser = await this.usersRepository.updateUser(options.email, {
			userPoints: user.userPoints + points,
			rankId: nextRank ? nextRank.id : user.rankId
		});

		if (!updatedUser) {
			return error;
		}

		if (nextRank) {
			await this.awardsService.updateOpenAwardsInUser(user.id, AwardCategory.RANKS);
		}
		await this.awardsService.updateOpenAwardsInUser(user.id, AwardCategory.POINTS);

		return updatedUser.userPoints;
	}

	async getRank(id: number): Promise<Rank | HTTPError> {
		if (Number.isNaN(id)) {
			return new HTTPError(HttpStatus.BAD_REQUEST, 'getRankById', 'Неверный тип данных', {
				error: 'Передаваемый параметр не является числом'
			});
		}
		const res = await this.ranksRepository.findRankById(id);
		if (!res) {
			return new HTTPError(HttpStatus.NOT_FOUND, 'getRankById', 'Не найдено', { error: 'Ранг не найден в базе' });
		}
		return res;
	}

	async getAllRanks(): Promise<Rank[] | HTTPError> {
		const ranks = await this.ranksRepository.findAllRanks();
		if (!ranks) {
			return new HTTPError(HttpStatus.NOT_FOUND, 'getRankById', 'Не найдено', { error: 'Не найдено ни одного ранга' });
		}
		return ranks.sort((a, b) => a.id - b.id);
	}

	async addPointsToSubscribedUsers(): Promise<void> {
		try {
			const users = await this.usersRepository.findUsersAndSelect('email', { notification: { equals: true } });
			for (const user of users) {
				await this.addPoints({ category: PointsItemCategory.Notification, email: user.email, useMultiplier: true });
			}
			this.logger.log(`[RankService] ${users.length} пользователей получили очки за подключённую рассылку`);
		} catch (error) {
			if (error instanceof Error) {
				this.logger.error(`[RanksService] Произошла ошибка при добавлении очков за рассылку. ${error.message}`);
			}
		}
	}

	private async preChangedCheck(dto: RankCreateDto, usingAward?: number | null): Promise<HTTPError | void> {
		if (!dto.awardId) return;
		const award = await this.awardsService.getById(dto.awardId);
		if (award instanceof Error) {
			return award;
		}
		const rankByAwardId = await this.ranksRepository.findRankByAwardId(dto.awardId);
		if (rankByAwardId && usingAward !== rankByAwardId.awardId) {
			return new HTTPError(HttpStatus.FORBIDDEN, 'preCreationCheck', 'Данный значок используется', {
				error: 'Данный значок используется'
			});
		}
	}

	private async checkForRankPromotion(user: UserModel, updateUserPoints: number): Promise<Rank | false> {
		// Проверка на максимальный ранг, если текущее обновленное кол-во очков больше у след. ранга, то повышаем
		const nextRank = await this.ranksRepository.findRankById(user.rankId + 1);
		if (!nextRank) {
			return false;
		}
		const result = updateUserPoints >= nextRank.points;
		if (result) {
			const correctRank = await this.ranksRepository.findFirstRankByLtPoints(updateUserPoints); // найду тот который надо
			this.logger.log(`[RanksService] Пользователь ${user.login} повышен в звании до ${correctRank?.id}`);
			return correctRank as Rank;
		}
		return result;
	}

	private isTemplateOptions(options: any): options is AddPointsWithTemplate {
		if (options.category && typeof options.category == 'number' && options.email && typeof options.email == 'string') {
			return true;
		}
		return false;
	}
}

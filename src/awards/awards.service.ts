import { inject, injectable } from 'inversify';
import { IAwardsService } from './awards.service.interface';
import { Award, AwardCategory } from '@prisma/client';
import { HTTPError } from '../errors/http-error';
import { AwardCreateDto } from './dto/award-create.dto';
import { TYPES } from '../types';
import { HttpStatus } from '../helpers/http-status';
import { ILoggerService } from '../logger/logger.service.interface';
import { IAwardsRepository } from './awards.repository.interface';
import { IUsersRepository } from '../users/users.repository.interface';

@injectable()
export class AwardsService implements IAwardsService {
	constructor(
		@inject(TYPES.IAwardsRepository) private awardsRepository: IAwardsRepository,
		@inject(TYPES.ILoggerService) private logger: ILoggerService,
		@inject(TYPES.IUsersRepository) private usersRepository: IUsersRepository
	) {}

	async create(dto: AwardCreateDto): Promise<HTTPError | Award> {
		const isValidCondition = await this.awardsRepository.isValidCondition(JSON.parse(dto.condition));
		if (!isValidCondition) {
			return new HTTPError(HttpStatus.BAD_REQUEST, 'create', 'Ошибка в условии', {
				error: 'Условие неправильно составлено'
			});
		}
		const award = await this.awardsRepository.create(dto);
		if (!award) {
			return new HTTPError(HttpStatus.INTERNAL_SERVER_ERROR, 'awardCreate', 'Ошибка на сервере', {
				error: 'Произошла ошибка при создании значка'
			});
		}
		await this.awardsRepository.addNewAwardUsers(award.id, JSON.parse(award.condition));
		this.logger.log(`[AwardsService] Создан новый значок с именем ${dto.name}`);
		return award;
	}

	async getById(id: number): Promise<Award | HTTPError> {
		const award = await this.awardsRepository.getAwardById(id);
		if (!award) {
			return new HTTPError(HttpStatus.NOT_FOUND, 'getById', 'Не найдено', { error: `Значок с id ${id} не найден` });
		}
		return award;
	}

	async update(id: number, dto: AwardCreateDto): Promise<Award | HTTPError> {
		const existAward = await this.awardsRepository.getAwardById(id);
		if (!existAward) {
			return new HTTPError(HttpStatus.NOT_FOUND, 'update', 'Не найдено', { error: `Не найдено значок с id ${id}` });
		}
		const isValidCondition = await this.awardsRepository.isValidCondition(JSON.parse(dto.condition));
		if (!isValidCondition) {
			return new HTTPError(HttpStatus.BAD_REQUEST, 'create', 'Ошибка в условии', {
				error: 'Условие неправильно составлено'
			});
		}
		const award = await this.awardsRepository.update(id, dto);
		if (!award) {
			return new HTTPError(HttpStatus.INTERNAL_SERVER_ERROR, 'update', 'Ошибка на сервере', {
				error: `Не удалось изменить значок с id ${id}. Повторите позже`
			});
		}
		await this.awardsRepository.removeAwardsInUsers(id);
		await this.awardsRepository.addNewAwardUsers(id, JSON.parse(award.condition));
		return award;
	}

	async getAllAwards(): Promise<Award[] | HTTPError> {
		const awards = await this.awardsRepository.getAllAwards();
		if (!awards.length) {
			return new HTTPError(HttpStatus.NOT_FOUND, 'getAllAwards', 'Не найдено', { error: 'Не найдено ни одного значка' });
		}
		return awards;
	}

	async selectUnopenedAwards(openedAwardsId: number[], category: AwardCategory): Promise<Award[]> {
		const awards = await this.awardsRepository.findAwardsByCategory(category);
		return awards.filter((award) => !openedAwardsId.includes(award.id));
	}

	async updateOpenAwardsInUser(userId: number, category: AwardCategory): Promise<void> {
		const possibleAwards = await this.selectUnopenedAwards(await this.usersRepository.getAwardsIdByUserId(userId), category);

		for (let i = 0; i < possibleAwards.length; i++) {
			const possibleUsers = await this.usersRepository.customRequest(JSON.parse(possibleAwards[i].condition));
			if (!possibleUsers || !possibleAwards.length || !possibleUsers?.map((user) => user.id).includes(userId)) {
				continue;
			} else {
				await this.usersRepository.addAwardByUserId(userId, possibleAwards[i].id);
				this.logger.log(`Пользователь с id ${userId} получил значок ${possibleAwards[i].name}`);
			}
		}
	}

	async deleteById(id: number): Promise<Award | HTTPError> {
		const existAward = await this.awardsRepository.getAwardById(id);
		if (!existAward) {
			return new HTTPError(HttpStatus.NOT_FOUND, 'deleteById', 'Не найдено', { error: `Не найдено значок с id ${id}` });
		}
		const deletedAward = await this.awardsRepository.deleteById(id);
		if (!deletedAward) {
			return new HTTPError(HttpStatus.INTERNAL_SERVER_ERROR, 'deleteById', 'Ошибка на сервере', {
				error: `Не удалось удалить значок с id ${id}. Повторите позже`
			});
		}
		this.logger.log(`[AwardService] Значок с id ${id} был удален`);
		return deletedAward;
	}

	async updatePositions(awards: Pick<Award, 'id' | 'position'>[]): Promise<void> {
		this.awardsRepository.updatePositions(awards);
	}
}

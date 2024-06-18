import { inject, injectable } from 'inversify';
import { IBonusService } from './bonus.service.interface';
import { BonusCreateDto } from './dto/bonus-create.dto';
import { Bonus, Holidays } from '@prisma/client';
import { HTTPError } from '../errors/http-error';
import { TYPES } from '../types';
import { IUsersService } from '../users/users.service.interface';
import { HttpStatus } from '../helpers/http-status';
import { IBonusRepository } from './bonus.repository.interface';
import { ILoggerService } from '../logger/logger.service.interface';

@injectable()
export class BonusService implements IBonusService {
	constructor(
		@inject(TYPES.ILoggerService) private logger: ILoggerService,
		@inject(TYPES.IUsersService) private usersService: IUsersService,
		@inject(TYPES.IBonusRepository) private bonusRepository: IBonusRepository
	) {}

	async create(dto: BonusCreateDto, email: string): Promise<Bonus | HTTPError> {
		const admin = await this.usersService.findUserByEmail(email);
		const user = await this.usersService.findUserById(dto.userId);
		if (!admin) {
			return new HTTPError(HttpStatus.FORBIDDEN, 'create', 'Запрещено', { error: `Администратор с email ${email} не найден` });
		}
		if (!user) {
			return new HTTPError(HttpStatus.NOT_FOUND, 'create', 'Не найден', { error: `Пользователь с id ${dto.userId} не найден` });
		}
		const date = new Date(dto.expiries);
		if (Number.isNaN(date.getDate())) {
			return new HTTPError(HttpStatus.BAD_REQUEST, 'create', 'Ошибка в сроке действия', {
				error: 'Срок действия указан неверно'
			});
		}
		if (Date.now() > date.getTime()) {
			return new HTTPError(HttpStatus.BAD_REQUEST, 'create', 'Время действия бонуса указано не верно', {
				error: 'Время действия не может быть в прошлом'
			});
		}
		const bonus = await this.bonusRepository.create({ ...dto, expiries: date }, admin.id);
		if (!bonus) {
			return new HTTPError(HttpStatus.INTERNAL_SERVER_ERROR, 'create', 'Ошибка на сервере', {
				error: 'Произошла ошибка на сервере. Попробуйте позже'
			});
		}
		this.logger.log(
			`[BonusService] Пользователь ${user.login} получил бонус ${bonus.multiplier}X действующий до ${date.toJSON()}`
		);
		return bonus;
	}

	async getCommonMultiplier(userId: number): Promise<number | null>;
	async getCommonMultiplier(email: string): Promise<number | null>;
	async getCommonMultiplier(emailOrId: string | number): Promise<number | null> {
		if (typeof emailOrId == 'number') {
			return await this.bonusRepository.getCommonMultiplier(emailOrId);
		}
		return await this.bonusRepository.getCommonMultiplier(emailOrId);
	}

	async getHolidays(): Promise<Holidays[]> {
		return await this.bonusRepository.getHolidays();
	}
}

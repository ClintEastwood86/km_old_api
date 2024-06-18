import { PointsItem } from '@prisma/client';
import { inject, injectable } from 'inversify';
import { HTTPError } from '../errors/http-error';
import { HttpStatus } from '../helpers/http-status';
import { TYPES } from '../types';
import { PointsItemCreateDto } from './dto/pointItem-create.dto';
import { IPointsItemRepository } from './pointsItem.repository.interface';
import { IPointsItemsService } from './pointsItems.service.interface';

@injectable()
export class PointsItemService implements IPointsItemsService {
	constructor(@inject(TYPES.IPointsItemRepository) private pointsItemRepository: IPointsItemRepository) {}

	async getPointsItemById(id: number): Promise<HTTPError | PointsItem> {
		const pointsItem = await this.pointsItemRepository.getById(id);
		if (!pointsItem) {
			return new HTTPError(HttpStatus.NOT_FOUND, 'getPointsItem', 'Не найдено', {
				error: `Points Item по id ${id} не был найден`
			});
		}
		return pointsItem;
	}

	async get(): Promise<PointsItem[] | HTTPError> {
		const pointsItems = await this.pointsItemRepository.getAll();
		if (!pointsItems.length) {
			return new HTTPError(HttpStatus.NOT_FOUND, 'getPointsItems', 'Не найдено', { error: 'Не найдено' });
		}
		return pointsItems;
	}

	async createPointsItem(dto: PointsItemCreateDto): Promise<HTTPError | PointsItem> {
		const pointsItem = await this.pointsItemRepository.create(dto);
		if (!pointsItem) {
			return new HTTPError(HttpStatus.INTERNAL_SERVER_ERROR, 'createPointsItem', 'Не удалось', {
				error: 'Ошибка на сервере, элемент не создан'
			});
		}
		return pointsItem;
	}
}

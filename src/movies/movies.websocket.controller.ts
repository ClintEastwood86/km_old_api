import { inject, injectable } from 'inversify';
import { BaseWebSocketController } from '../common/base.websocket.controller';
import { TYPES } from '../types';
import { IncomingMessage } from 'http';
import { ILoggerService } from '../logger/logger.service.interface';
import { IUsersService } from '../users/users.service.interface';
import { HTTPError } from '../errors/http-error';
import { IConfigService } from '../configs/config.service.interface';
import { HttpStatus } from '../helpers/http-status';
import { IMoviesService } from './movies.service.interface';
import { WebSocket, RawData } from 'ws';
import { SeeMovieDto } from './dto/see-movie.dto';
import { v4 as uuid } from 'uuid';
import { MoviesConnectionResponse, MoviesWebsocketTypeResponse } from './movies.websocket.interface';
import dayjs from 'dayjs';
import { IRanksService } from '../ranks/ranks.service.interface';
import { PointsItemCategory } from '../pointsItems/pointsItem.enum';

@injectable()
export class MoviesWebSocketController extends BaseWebSocketController {
	private minutesInTick: number;

	constructor(
		@inject(TYPES.IConfigService) private config: IConfigService,
		@inject(TYPES.ILoggerService) private logger: ILoggerService,
		@inject(TYPES.IUsersService) private usersService: IUsersService,
		@inject(TYPES.IRanksService) private ranksService: IRanksService,
		@inject(TYPES.IMoviesService) private moviesService: IMoviesService
	) {
		super(logger, config);
		this.bindEvents('/movies', this.onConnection);
		this.minutesInTick = Number(this.config.get('TICK_TIME'));
	}

	private onConnection(): void {
		this.wss.on('connection', async (socket: WebSocket, req: IncomingMessage) => {
			const domain = `https://${this.config.get('DOMAIN')}`;
			const unauthorizedError = new HTTPError(HttpStatus.UNAUTHORIZED, 'onConnection', 'Не авторизован', {
				error: 'Пройдите авторизацию'
			});
			const badIdError = new HTTPError(HttpStatus.BAD_REQUEST, 'onConnection', 'Не найдено', {
				error: 'Фильм с таким id не найден'
			});
			const forbiddenError = new HTTPError(HttpStatus.FORBIDDEN, 'onConnection', 'Запрещено', {
				error: `Функция работает только на сайте ${domain}`
			});

			if (req.headers.origin !== domain) {
				return this.sendError(socket, true, forbiddenError);
			}

			const movieId = Number(new URLSearchParams(req.url?.slice(req.url.lastIndexOf('?'))).get('movie'));
			if (Number.isNaN(movieId) || !(await this.moviesService.getMovieById(movieId))) {
				return this.sendError(socket, true, badIdError);
			}

			if (!req.headers.cookie?.includes('accessToken')) return this.sendError(socket, true, unauthorizedError);
			const authResult = await this.checkAuthorization(
				new URLSearchParams(req.headers.cookie.replace(/[ ]/g, '&')).get('accessToken')?.replace(';', '')
			);
			if (!authResult) return this.sendError(socket, true, unauthorizedError);
			req.user = authResult;

			const token = uuid();
			await this.usersService.setViewToken(req.user, token);
			await this.moviesService.addHistoryRecord(req.user, token, movieId);
			const data: MoviesConnectionResponse = {
				type: MoviesWebsocketTypeResponse.Connect,
				data: { token }
			};
			socket.send(JSON.stringify(data));

			socket.on('message', (data) => this.onMessage(socket, req, data));
		});
	}

	private async onMessage(socket: WebSocket, req: IncomingMessage, data: RawData): Promise<void> {
		const dto = this.parse<SeeMovieDto>(data);
		if (!dto) return this.sendError(socket, false, new Error('Передан не json'));
		const validateResult = await this.validate(SeeMovieDto, dto);
		if (validateResult) return this.sendError(socket, false, validateResult);

		const lastRecord = await this.moviesService.getLastHistoryRecord(req.user);
		if (
			!lastRecord ||
			dayjs(new Date()).diff(lastRecord?.createdAt, 'minutes') < this.minutesInTick ||
			dto.token !== lastRecord.token
		) {
			return;
		}

		await this.ranksService.addPoints({ category: PointsItemCategory.View, email: req.user, useMultiplier: true });
		await this.moviesService.addHistoryRecord(req.user, dto.token, lastRecord.movieId);
		await this.usersService.addViewTime(req.user, this.minutesInTick);
	}
}

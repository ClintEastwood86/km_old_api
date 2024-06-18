import { Server } from 'http';
import { injectable } from 'inversify';
import { RawData, WebSocket, WebSocketServer, Server as WsServer } from 'ws';
import { ILoggerService } from '../logger/logger.service.interface';
import { HTTPError } from '../errors/http-error';
import { ClassConstructor, plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { HttpStatus } from '../helpers/http-status';
import { JwtPayload, verify } from 'jsonwebtoken';
import { IConfigService } from '../configs/config.service.interface';
import { join } from 'path';

@injectable()
export abstract class BaseWebSocketController {
	private events: (() => unknown)[];
	private path: string;
	wss: WsServer;

	constructor(private loggerService: ILoggerService, private configService: IConfigService) {}

	public useEvents(httpServer: Server): void {
		this.wss = new WebSocketServer({ server: httpServer, path: this.path });
		for (const f of this.events) {
			f.apply(this);
		}
		this.loggerService.log(`[WS] ${this.path}`);
	}

	protected sendError(socket: WebSocket, close: boolean, error: Error | HTTPError): void {
		delete error.stack;
		socket.send(JSON.stringify(error));
		close && socket.close();
		if (error instanceof HTTPError) {
			return this.loggerService.error(`[${error.context}] Ошибка: ${error.code} ${error.message}`);
		}
		this.loggerService.error(`[BaseWebSocketController] Ошибка: 500 ${error.message}`);
	}

	protected async checkAuthorization(token?: string): Promise<string | null> {
		try {
			if (!token) return null;
			const payload = verify(token, this.configService.get('ACCESS_TOKEN_SECRET')) as JwtPayload;
			return payload.email;
		} catch (error) {
			return null;
		}
	}

	protected bindEvents(path: string, ...events: (() => unknown)[]): void {
		this.events = events;
		this.path = join('/ws', path);
	}

	protected parse<T extends Record<string, any> | unknown = unknown>(data: RawData): T | null {
		try {
			const parsedData: T = JSON.parse(data.toString());
			return parsedData;
		} catch (error) {
			return null;
		}
	}

	protected async validate(classToValidate: ClassConstructor<object>, body: any): Promise<HTTPError | null> {
		const instance = plainToClass(classToValidate, body);
		const errors = await validate(instance);
		if (!errors.length) {
			return null;
		}
		return new HTTPError(HttpStatus.BAD_REQUEST, 'validator', 'Не прошёл валидацию', {
			error: 'Данные не прошли проверку',
			data: errors[0].constraints
		});
	}
}

import { inject, injectable } from 'inversify';
import { TYPES } from '../types';
import { IFeedbackService } from './feedback.service.interface';
import { NewAppFeedbackDto } from './dto/new-app-feedback.dto';
import { HTTPError } from '../errors/http-error';
import { HttpStatus } from '../helpers/http-status';
import { ILoggerService } from '../logger/logger.service.interface';
import { IConfigService } from '../configs/config.service.interface';

@injectable()
export class FeedbackService implements IFeedbackService {
	constructor(
		@inject(TYPES.ILoggerService) private logger: ILoggerService,
		@inject(TYPES.IConfigService) private configService: IConfigService
	) {}

	async submitNewAppForm(dto: NewAppFeedbackDto): Promise<true | HTTPError> {
		const token = this.configService.get('TELEGRAM_BOT_TOKEN');
		const chatId = this.configService.get('TELEGRAM_CHAT_ID');
		const topicId = this.configService.get('TELEGRAM_TOPIC_ID');

		if (!token || !chatId) {
			this.logger.error('[FeedbackService] Не настроены TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID');
			return new HTTPError(HttpStatus.INTERNAL_SERVER_ERROR, 'send', 'Сервис недоступен', {
				error: 'Telegram не настроен'
			});
		}

		const username = dto.username?.trim() ?? 'гость';
		const features = dto.keepFeatures.length ? dto.keepFeatures.map((f) => `• ${f}`).join('\n') : '<i>ничего не выбрано</i>';
		const wishes = dto.wishes?.trim() ?? '<i>не указаны</i>';

		const text = [
			'<b>📝 Опрос о переработке приложения</b>',
			'',
			`<b>Пользователь:</b> ${username}`,
			'',
			'<b>Оставить функции:</b>',
			features,
			'',
			'<b>Пожелания:</b>',
			wishes
		].join('\n');

		const body: Record<string, unknown> = {
			chat_id: chatId,
			text,
			parse_mode: 'HTML',
			disable_web_page_preview: true
		};
		if (topicId) {
			const topicNum = Number(topicId);
			body.message_thread_id = Number.isNaN(topicNum) ? topicId : topicNum;
		}

		try {
			const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
			if (!res.ok) {
				const errorText = await res.text().catch(() => '');
				this.logger.error(`[FeedbackService] Telegram API вернул ${res.status}: ${errorText}`);
				return new HTTPError(HttpStatus.BAD_GATEWAY, 'send', 'Ошибка отправки', {
					error: 'Не удалось отправить сообщение в Telegram'
				});
			}
			return true;
		} catch (err) {
			this.logger.error(`[FeedbackService] Ошибка при обращении к Telegram: ${(err as Error).message}`);
			return new HTTPError(HttpStatus.BAD_GATEWAY, 'send', 'Ошибка отправки', {
				error: 'Не удалось отправить сообщение в Telegram'
			});
		}
	}
}

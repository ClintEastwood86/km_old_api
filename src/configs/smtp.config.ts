import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { IConfigService } from './config.service.interface';

export const getSMPTConfig = (configService: IConfigService): SMTPTransport.Options => {
	return {
		service: 'Yandex',
		secure: true,
		port: 465,
		host: 'smtp.yandex.ru',
		auth: {
			user: configService.get('SMTP_USER'),
			pass: configService.get('SMTP_PASS')
		}
	};
};

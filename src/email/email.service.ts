import { Transporter, createTransport } from 'nodemailer';
import { IEmailService, ReturnTypeSendEmail } from './email.service.interface';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { HTTPError } from '../errors/http-error';
import { getSMPTConfig } from '../configs/smtp.config';
import { IConfigService } from '../configs/config.service.interface';
import { getConfirmEmailTemplate } from './templates/confirm.template';
import { TYPES } from '../types';
import { inject, injectable } from 'inversify';
import { HttpStatus } from '../helpers/http-status';
import { getBanEmailTemplate } from './templates/ban.template';
import { getForgotPasswordTemplate } from './templates/forgot-password.template';

@injectable()
export class EmailService implements IEmailService {
	private transporter: Transporter<SMTPTransport.SentMessageInfo>;
	private fromEmail: string;
	private domain: string;
	private supportEmail: string;
	private reportEmail: string;

	constructor(@inject(TYPES.IConfigService) private configService: IConfigService) {
		this.transporter = createTransport(getSMPTConfig(configService));
		this.fromEmail = `KingMovies <${this.configService.get('SMTP_USER')}>`;
		this.domain = this.configService.get('DOMAIN');
		this.supportEmail = this.configService.get('SUPPORT_EMAIL');
		this.reportEmail = this.configService.get('REPORT_EMAIL');
	}

	async sendBanEmail(address: string, login: string, admin: string, message: string): Promise<HTTPError | ReturnTypeSendEmail> {
		try {
			const { attachments, html } = getBanEmailTemplate(login, admin, message, this.domain, this.supportEmail);
			const { messageId } = await this.transporter.sendMail({
				attachments,
				from: this.fromEmail,
				to: address,
				html,
				subject: 'Your account is blocked'
			});
			return { messageId };
		} catch (error) {
			if (error instanceof Error) {
				return new HTTPError(
					HttpStatus.INTERNAL_SERVER_ERROR,
					'EmailService',
					`Не удалось отправить письмо на почту ${address}`,
					{
						error: error.message
					}
				);
			}
			return { messageId: '' };
		}
	}

	async sendConfirmEmail(address: string, login: string, token: string): Promise<ReturnTypeSendEmail | HTTPError> {
		try {
			const { attachments, html } = getConfirmEmailTemplate(login, token, this.domain, this.supportEmail);
			const { messageId } = await this.transporter.sendMail({
				from: this.fromEmail,
				to: address,
				subject: 'Verify E-Mail Address',
				html,
				attachments
			});
			return {
				messageId
			};
		} catch (error) {
			if (error instanceof Error) {
				return new HTTPError(
					HttpStatus.INTERNAL_SERVER_ERROR,
					'EmailService',
					`Не удалось отправить письмо на почту ${address}`,
					{
						error: error.message
					}
				);
			}
			return { messageId: '' };
		}
	}

	async sendForgotPasswordEmail(address: string, login: string, token: string): Promise<ReturnTypeSendEmail | HTTPError> {
		try {
			const { attachments, html } = getForgotPasswordTemplate(login, token, this.domain, this.supportEmail);
			const { messageId } = await this.transporter.sendMail({
				from: this.fromEmail,
				to: address,
				subject: 'Forgot password',
				html,
				attachments
			});
			return {
				messageId
			};
		} catch (error) {
			if (error instanceof Error) {
				return new HTTPError(
					HttpStatus.INTERNAL_SERVER_ERROR,
					'EmailService',
					`Не удалось отправить письмо на почту ${address}`,
					{
						error: error.message
					}
				);
			}
			return { messageId: '' };
		}
	}
}

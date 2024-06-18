import { HTTPError } from '../errors/http-error';

export interface ReturnTypeSendEmail {
	messageId: string;
}

export interface IEmailService {
	sendConfirmEmail(address: string, login: string, token: string): Promise<HTTPError | ReturnTypeSendEmail>;
	sendBanEmail(address: string, login: string, admin: string, message: string): Promise<HTTPError | ReturnTypeSendEmail>;
}

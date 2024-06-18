import Mail from 'nodemailer/lib/mailer';

export interface IEmailTemplate {
	html: string;
	attachments?: Mail.Attachment[];
}

import { join } from 'path';
import { IEmailTemplate } from '../template.interface';
import { path } from 'app-root-path';

export const getForgotPasswordTemplate = (
	login: string,
	token: string,
	domain: string,
	supportEmail: string
): IEmailTemplate => ({
	attachments: [
		{
			cid: 'logo',
			filename: 'logo',
			path: join(path, './assets/logo.png')
		}
	],
	html: `
		<html lang="en" xmlns="http://www.w3.org/1999/xhtml"><head>
			<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Сброс пароля | KingMovies</title>
		</head>

		<body style="width: 100%; margin: 0px; padding: 0px; text-size-adjust: 100%;">
			<table width="500px" height="100%" cellpadding="0" cellspacing="0" border="0" align="left" valign="top">
				<tbody>
					<tr><td align="center" valign="top">
						<table width="600" align="center" cellpadding="0" cellspacing="0" border="0" valign="top"><tbody></tbody></table>
						<table align="center" bgcolor="#191930" cellpadding="27" valign="top" width="100%" cellspacing="0" border="0">
							<tbody>
								<tr>
									<td align="center" style="border-bottom: 1px solid rgb(43, 43, 68);"><img alt="logo" src="cid:logo" width="151" height="102" style="display: block;outline: none;border: none;text-decoration: none;">
									</td>
								</tr>
								<tr>
									<td>
										<span style="font-family: Arial; font-size: 14px; font-weight: 400; line-height: 19px; color: rgb(255, 255, 255);">Запрос на восстановление пароля от аккаунта – <span style="font-family: Arial; font-size: 14px; font-weight: 400; line-height: 19px; color: rgb(252, 183, 79);">${login}</span>! </span><span style="font-family: Arial; font-size: 14px; font-weight: 400; line-height: 19px; color: rgb(255, 255, 255); display: block; margin-top: 23px;">Если вы не запрашивали смену пароля, просим вас проигнорировать данное письмо.</span><span style="font-family: Arial;font-size: 14px;font-weight: 400;line-height: 19px;color: rgb(255, 255, 255);display: block;margin-top: 34px;">
											<a href="${domain}/profile/forgotPassword?token=${token}" target="_blank" style="font-family: Arial;text-decoration: none;font-weight: 500;font-size: 16px;line-height: 20px;color: rgb(252, 183, 79);border: 1px solid rgb(252, 183, 79);border-radius: 4px;padding: 12px 19px;background: transparent;">Сменить пароль</a>
										</span>
									</td>
								</tr>
								<tr>
									<td align="center" bgcolor="#090909"><span style="font-family: Arial; font-size: 14px; font-weight: 400; line-height: 19px; color: rgb(72, 72, 72);">Наш
											сайт - <a href="${domain}" target="_blank" style="color: rgb(72, 72, 72); text-decoration: underline;">${domain}</a></span><span style="font-family: Arial; font-size: 14px; font-weight: 400; line-height: 19px; color: rgb(72, 72, 72); display: block; margin-top: 16px;"><a href="mailto:${supportEmail}" target="_blank" style="color: rgb(72, 72, 72); text-decoration: underline;">${supportEmail}</a></span></td>
								</tr>
							</tbody>
						</table>
					</td></tr>
				</tbody>
			</table>
		</body>
		</html>
	`
});

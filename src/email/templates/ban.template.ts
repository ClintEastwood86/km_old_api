import { join } from 'path';
import { IEmailTemplate } from '../template.interface';
import { path } from 'app-root-path';

export const getBanEmailTemplate = (
	login: string,
	adminLogin: string,
	message: string,
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
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">

<head>
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Ваш аккаунт заблокирован | KingMovies</title>
</head>

<body style="width: 100%; margin: 0px; padding: 0px; text-size-adjust: 100%;">
	<table width="500px" height="100%" cellpadding="0" cellspacing="0" border="0" align="left" valign="top">
		<tbody>
			<tr>
				<td align="center" valign="top">
					<table width="600" align="center" cellpadding="0" cellspacing="0" border="0" valign="top">
						<tbody>
							<table align="center" bgcolor="#191930" cellpadding="27" valign="top" width="100%"
								cellspacing="0" border="0">
								<tbody>
									<tr>
										<td align="center" style="border-bottom: 1px solid rgb(43, 43, 68);"><img
												alt="logo" src="cid:logo" width="151" height="102"
												style="display: block; outline: none; border: none; text-decoration: none;">
										</td>
									</tr>
									<tr>
										<td><span
												style="font-family: Arial; font-size: 14px; font-weight: 400; line-height: 19px; color: rgb(255, 255, 255);">Уважаемый,
												<span
													style="font-family: Arial; font-size: 14px; font-weight: 400; line-height: 19px; color: rgb(252, 183, 79);">${login}</span>!</span><span
												style="font-family: Arial; font-size: 14px; font-weight: 400; line-height: 19px; color: rgb(255, 255, 255); display: block; margin-top: 23px;">Ваш
												аккаунт был заблокирован администратором <span
													style="font-family: Arial; font-size: 14px; line-height: 19px; color: rgb(252, 183, 79); font-weight: 400;">${adminLogin}</span></span><span
												style="font-family: Arial; font-size: 14px; font-weight: 400; line-height: 19px; color: rgb(255, 255, 255); display: block; margin-top: 18px;">Причина
												блокировки: <span
													style="font-family: Arial; font-size: 14px; font-weight: 400; line-height: 19px; color: rgb(252, 183, 79);">${message} </span></span><span
												style="font-family: Arial; font-size: 14px; font-weight: 400; line-height: 19px; color: rgb(255, 255, 255); display: block; margin-top: 18px;">Если
												вы хотите исправиться или считаете, что администратор не должен был Вас
												наказывать, напишите нам на <a target="_blank"
													href="mailto:${supportEmail}"
													style="text-decoration: underline; color: rgb(252, 183, 79); font-family: Arial; font-size: 14px; font-weight: 400; line-height: 19px;"><span
														style="font-family: Arial; font-size: 14px; line-height: 19px; color: rgb(252, 183, 79); font-weight: 400;">почту</span></a> </span><span
												style="font-family: Arial; font-size: 14px; font-weight: 400; line-height: 19px; color: rgb(255, 255, 255); display: block; margin-top: 18px;">В
												том случае, если виноват администратор, мы выдадим вам компенсацию в
												виде очков или множителя на неделю. </span><span
												style="font-family: Arial; font-size: 14px; font-weight: 400; line-height: 19px; color: rgb(255, 255, 255); display: block; margin-top: 18px;">Поспешите,
												иначе ваш аккаунт будет через 30 дней</span></td>
									</tr>
									<tr>
										<td align="center" bgcolor="#090909"><span
												style="font-family: Arial; font-size: 14px; font-weight: 400; line-height: 19px; color: rgb(72, 72, 72);">Наш
												сайт - <a href="${domain}" target="_blank"
													style="color: rgb(72, 72, 72); text-decoration: underline;">${domain}</a></span><span
												style="font-family: Arial; font-size: 14px; font-weight: 400; line-height: 19px; color: rgb(72, 72, 72); display: block; margin-top: 16px;"><a
													href="mailto:${supportEmail}" target="_blank"
													style="color: rgb(72, 72, 72); text-decoration: underline;">${supportEmail}</a></span>
										</td>
									</tr>
								</tbody>
							</table>
						</tbody>
					</table>
				</td>
			</tr>
		</tbody>
	</table>
</body>

</html>`
});

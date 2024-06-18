import { compare, hash } from 'bcryptjs';

interface UserConstructorParams {
	login: string;
	email: string;
	notification: boolean;
	confirmToken: string;
	notificationToken: string;
}

export class User {
	private readonly _login: string;
	private readonly _email: string;
	private readonly _confirmToken: string;
	private readonly _notificationToken: string;
	private _password: string;

	private readonly _notification: boolean;

	constructor({ login, email, notification, confirmToken, notificationToken }: UserConstructorParams, passwordHash?: string) {
		this._login = login;
		this._email = email;
		this._notification = notification;
		this._confirmToken = confirmToken;
		this._notificationToken = notificationToken;

		if (passwordHash) {
			this._password = passwordHash;
		}
	}

	get login(): typeof this._login {
		return this._login;
	}

	get confirmToken(): typeof this._confirmToken {
		return this._confirmToken;
	}

	get notificationToken(): typeof this._notificationToken {
		return this._notificationToken;
	}

	get email(): typeof this._email {
		return this._email;
	}

	get notification(): typeof this._notification {
		return this._notification;
	}

	get password(): string {
		return this._password;
	}

	async setPassword(password: string, salt: number): Promise<void> {
		this._password = await hash(password, salt);
	}

	async comparePassword(password: string): Promise<boolean> {
		return compare(password, this.password);
	}
}

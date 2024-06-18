import { Response, Router } from 'express';

export type HttpReturnType = Response<any, Record<string, any>>;
export type WithRouter<T> = T & { router: Router };
export interface JwtResponse {
	jwtAccess: string;
	jwtRefresh: string;
}

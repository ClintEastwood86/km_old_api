import { Job, scheduleJob } from 'node-schedule';
import { IScheduleService } from './schedule.service.interface';
import { inject, injectable } from 'inversify';
import { TYPES } from '../types';
import { ILoggerService } from '../logger/logger.service.interface';
import 'reflect-metadata';

@injectable()
export class ScheduleService implements IScheduleService {
	private jobs: Job[] = [];

	constructor(@inject(TYPES.ILoggerService) private logger: ILoggerService) {}

	everyMonth(name: string, cb: (...args: any[]) => any): string {
		const job = scheduleJob(name, '0 0 0 1 * *', () => cb());
		this.jobs.push(job);
		this.logger.log(`[ScheduleService] Запланирован новый процесс – ${job.name} [EM]`);
		return job.name;
	}

	everyDay(name: string, cb: (...args: any[]) => any): string {
		const job = scheduleJob(name, '0 0 0 * * *', () => cb());
		this.jobs.push(job);
		this.logger.log(`[ScheduleService] Запланирован новый процесс – ${job.name} [ED]`);
		return job.name;
	}

	everyHour(name: string, cb: (...args: any[]) => any): string {
		const job = scheduleJob(name, '0 0 * * * *', () => cb());
		this.jobs.push(job);
		this.logger.log(`[ScheduleService] Запланирован новый процесс – ${job.name} [EH]`);
		return job.name;
	}
}

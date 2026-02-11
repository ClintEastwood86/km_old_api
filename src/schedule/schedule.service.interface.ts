export interface IScheduleService {
	everyMonth(name: string, cb: (...args: any[]) => any): string;
	everyDay(name: string, cb: (...args: any[]) => any): string;
	everyHour(name: string, cb: (...args: any[]) => any): string;
}

import { PointsItemCategory } from '../pointsItems/pointsItem.enum';

interface IHistoryItem {
	userModelId: number;
	multiplier: number;
}

export class HistoryItemWithTemplate implements IHistoryItem {
	private readonly _userId: number;
	private readonly _pointsItemId: number;
	private readonly _multiplier: number;

	constructor(userId: number, pointsItemId: PointsItemCategory, multiplier: number) {
		this._pointsItemId = pointsItemId;
		this._userId = userId;
		this._multiplier = multiplier;
	}

	get userModelId(): typeof this._userId {
		return this._userId;
	}

	get pointsItemId(): typeof this._pointsItemId {
		return this._pointsItemId;
	}

	get multiplier(): typeof this._multiplier {
		return this._multiplier;
	}
}

export class HistoryItemWithoutTemplate implements IHistoryItem {
	private readonly _name: string;
	private readonly _addPoints: number;
	private readonly _userId: number;
	private readonly _multiplier: number;

	constructor({ name, addPoints, userId, multiplier }: { name: string; addPoints: number; userId: number; multiplier: number }) {
		this._name = name;
		this._addPoints = addPoints;
		this._userId = userId;
		this._multiplier = multiplier;
	}

	get name(): typeof this._name {
		return this._name;
	}

	get addPoints(): typeof this._addPoints {
		return this._addPoints;
	}

	get userModelId(): typeof this._userId {
		return this._userId;
	}

	get multiplier(): typeof this._multiplier {
		return this._multiplier;
	}
}

abstract class HistoryItemFactory {
	abstract createHistoryItem(...args: any[]): HistoryItemWithTemplate | HistoryItemWithoutTemplate;
}

export class HistoryItemWithTemplateFactory extends HistoryItemFactory {
	createHistoryItem(...params: ConstructorParameters<typeof HistoryItemWithTemplate>): HistoryItemWithTemplate {
		return new HistoryItemWithTemplate(...params);
	}
}

export class HistoryItemWithoutTemplateFactory extends HistoryItemFactory {
	createHistoryItem(...params: ConstructorParameters<typeof HistoryItemWithoutTemplate>): HistoryItemWithoutTemplate {
		return new HistoryItemWithoutTemplate(...params);
	}
}

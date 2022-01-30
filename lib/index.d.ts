export declare const getRegistry: <T>(x: string) => Registry<T>;
export declare type Flat<T> = {
	[index: string | number]: T;
};
export declare class Registry<T>
	implements Map<number | string, T | Promise<T>>
{
	private _directory;
	private _datafile;
	private _state;
	private _state_waiting;
	constructor(directory: string);
	get flat(): Flat<T>;
	set flat(data: Flat<T>);
	load(): void;
	save(): void;
	traverse<NT = T>(relative: string): Registry<NT>;
	clear(): void;
	delete(key: string | number): boolean;
	forEach(
		callbackfn: (
			value: T | Promise<T>,
			key: string | number,
			map: Map<string | number, T | Promise<T>>
		) => void,
		thisArgument?: any
	): void;
	entries(): IterableIterator<[string | number, T | Promise<T>]>;
	get(key: string | number): T | Promise<T> | undefined;
	has(key: string | number): boolean;
	keys(): IterableIterator<string | number>;
	set(key: string | number, value: T | Promise<T>): this;
	get size(): number;
	values(): IterableIterator<T | Promise<T>>;
	[Symbol.iterator](): Generator<
		[string | number, T | Promise<T>],
		undefined,
		never
	>;
	get [Symbol.toStringTag](): string;
}

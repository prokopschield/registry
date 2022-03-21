import * as J from 'doge-json';
import { homedir } from 'os';
import path from 'path';
import { cacheFn } from 'ps-std/lib/functions/cacheFn';
import Hound, { watch } from 'ts-hound';

const home = path.resolve(homedir(), '.psreg');

const getRegistryFormatted = cacheFn(
	<T>(directory: string) => new Registry<T>(directory)
);

export const getRegistry = cacheFn(<T>(directory: string): Registry<T> => {
	const filtered = path.resolve('/', directory);
	const from_home = path.relative(home, filtered);
	const true_relative = path.relative('/', path.resolve('/', from_home));
	const normalized = path.resolve(home, true_relative);

	if (!normalized.includes(home)) {
		return getRegistry(normalized.replace(/[^a-z]+/gi, '_'));
	}

	return getRegistryFormatted(normalized);
});

export type Flat<T> = { [index: string | number]: T };

export class Registry<T> implements Map<number | string, T | Promise<T>> {
	private _directory: string;
	private _datafile: string;
	private _state = new Map<string, T>();
	private _state_waiting = new Map<string, Promise<T>>();
	constructor(directory: string) {
		directory = this._directory = path.resolve(directory);
		this._datafile = path.resolve(directory, 'data.json');
		this.load();
	}
	private _hound?: Hound;
	get hound() {
		return (this._hound ||= watch(this._datafile).on('change', (file) => {
			this.load(file);
		}));
	}
	get flat() {
		const returnValue: { [index: string]: T } = {};

		for (const [key, value] of this._state.entries()) {
			returnValue[key] = value;
		}

		return returnValue;
	}
	set flat(data: Flat<T>) {
		if (data && typeof data === 'object') {
			for (const [key, value] of Object.entries(data) as [string, T][]) {
				this._state.set(key, value);
			}
		} else if (data) {
			this.flat = { data };
		}
	}
	load(file = this._datafile) {
		if ((this.flat = J.read(file))) {
			this.hound.watch(file);
		}
	}
	save() {
		this._hound?.unwatch(this._datafile);
		J.write(this._datafile, this._state);
		this.hound.watch(this._datafile);
	}
	traverse<NT = T>(relative: string): Registry<NT> {
		return getRegistry(path.resolve(this._directory, relative));
	}
	clear() {
		return this._state.clear();
	}
	delete(key: string | number) {
		return this._state.delete(String(key));
	}
	forEach(
		callbackfn: (
			value: T | Promise<T>,
			key: string | number,
			map: Map<string | number, T | Promise<T>>
		) => void,
		thisArgument?: any
	): void {
		for (const [key, value] of this.entries()) {
			callbackfn.call(thisArgument || this, value, key, this);
		}
	}
	entries(): IterableIterator<[string | number, T | Promise<T>]> {
		return this._state.entries();
	}
	get(key: string | number): T | Promise<T> | undefined {
		return (
			this._state_waiting.get(String(key)) || this._state.get(String(key))
		);
	}
	has(key: string | number): boolean {
		return this._state.has(String(key));
	}
	keys(): IterableIterator<string | number> {
		return this._state.keys();
	}
	set(key: string | number, value: T | Promise<T>): this {
		if (value instanceof Promise) {
			this._state_waiting.set(String(key), value);
			value.then((new_value: T) => {
				this._state_waiting.delete(String(key));
				this.set(key, new_value);
			});
		} else {
			this._state.set(String(key), value);
			this.save();
		}

		return this;
	}
	get size() {
		return this._state.size;
	}
	values(): IterableIterator<T | Promise<T>> {
		return this._state.values();
	}
	*[Symbol.iterator](): Generator<
		[string | number, T | Promise<T>],
		undefined,
		never
	> {
		for (const key of this.keys()) {
			const value = this.get(key);

			if (value !== undefined) {
				yield [key, value];
			}
		}

		return undefined;
	}
	get [Symbol.toStringTag]() {
		return `Registry<${path.relative(home, this._directory)}>`;
	}
}

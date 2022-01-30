'use strict';
var __createBinding =
	(this && this.__createBinding) ||
	(Object.create
		? function (o, m, k, k2) {
				if (k2 === undefined) k2 = k;
				Object.defineProperty(o, k2, {
					enumerable: true,
					get: function () {
						return m[k];
					},
				});
		  }
		: function (o, m, k, k2) {
				if (k2 === undefined) k2 = k;
				o[k2] = m[k];
		  });
var __setModuleDefault =
	(this && this.__setModuleDefault) ||
	(Object.create
		? function (o, v) {
				Object.defineProperty(o, 'default', {
					enumerable: true,
					value: v,
				});
		  }
		: function (o, v) {
				o['default'] = v;
		  });
var __importStar =
	(this && this.__importStar) ||
	function (mod) {
		if (mod && mod.__esModule) return mod;
		var result = {};
		if (mod != null)
			for (var k in mod)
				if (
					k !== 'default' &&
					Object.prototype.hasOwnProperty.call(mod, k)
				)
					__createBinding(result, mod, k);
		__setModuleDefault(result, mod);
		return result;
	};
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod };
	};
Object.defineProperty(exports, '__esModule', { value: true });
exports.Registry = exports.getRegistry = void 0;
const J = __importStar(require('doge-json'));
const node_os_1 = require('node:os');
const node_path_1 = __importDefault(require('node:path'));
const cacheFn_1 = require('ps-std/lib/functions/cacheFn');
const home = node_path_1.default.resolve((0, node_os_1.homedir)(), '.psreg');
const getRegistryFormatted = (0, cacheFn_1.cacheFn)(
	(directory) => new Registry(directory)
);
exports.getRegistry = (0, cacheFn_1.cacheFn)((directory) => {
	const filtered = node_path_1.default.resolve('/', directory);
	const from_home = node_path_1.default.relative(home, filtered);
	const true_relative = node_path_1.default.relative(
		'/',
		node_path_1.default.resolve('/', from_home)
	);
	const normalized = node_path_1.default.resolve(home, true_relative);
	if (!normalized.includes(home)) {
		return (0, exports.getRegistry)(normalized.replace(/[^a-z]+/gi, '_'));
	}
	return getRegistryFormatted(normalized);
});
class Registry {
	constructor(directory) {
		this._state = new Map();
		this._state_waiting = new Map();
		directory = this._directory = node_path_1.default.resolve(directory);
		this._datafile = node_path_1.default.resolve(directory, 'data.json');
		this.load();
	}
	get flat() {
		const returnValue = {};
		for (const [key, value] of this._state.entries()) {
			returnValue[key] = value;
		}
		return returnValue;
	}
	set flat(data) {
		if (data && typeof data === 'object') {
			for (const [key, value] of Object.entries(data)) {
				this._state.set(key, value);
			}
		} else if (data) {
			this.flat = { data };
		}
	}
	load() {
		this.flat = J.read(this._datafile);
	}
	save() {
		J.write(this._datafile, this._state);
	}
	traverse(relative) {
		return (0, exports.getRegistry)(
			node_path_1.default.resolve(this._directory, relative)
		);
	}
	clear() {
		return this._state.clear();
	}
	delete(key) {
		return this._state.delete(String(key));
	}
	forEach(callbackfn, thisArgument) {
		for (const [key, value] of this.entries()) {
			callbackfn.call(thisArgument || this, value, key, this);
		}
	}
	entries() {
		return this._state.entries();
	}
	get(key) {
		return (
			this._state_waiting.get(String(key)) || this._state.get(String(key))
		);
	}
	has(key) {
		return this._state.has(String(key));
	}
	keys() {
		return this._state.keys();
	}
	set(key, value) {
		if (value instanceof Promise) {
			this._state_waiting.set(String(key), value);
			value.then((new_value) => {
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
	values() {
		return this._state.values();
	}
	*[Symbol.iterator]() {
		for (const key of this.keys()) {
			const value = this.get(key);
			if (value !== undefined) {
				yield [key, value];
			}
		}
		return undefined;
	}
	get [Symbol.toStringTag]() {
		return `Registry<${node_path_1.default.relative(
			home,
			this._directory
		)}>`;
	}
}
exports.Registry = Registry;

#!/usr/bin/env node
'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const _1 = require('.');
let reg = (0, _1.getRegistry)('/');
for (const value of process.argv.slice(2)) {
	reg = reg.traverse(value);
}
console.log(reg.flat);

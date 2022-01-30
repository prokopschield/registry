#!/usr/bin/env node

import { getRegistry } from '.';

let reg = getRegistry('/');

for (const value of process.argv.slice(2)) {
	reg = reg.traverse(value);
}

console.log(reg.flat);

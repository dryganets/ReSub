"use strict";
/**
* Options.ts
* Author: David de Regt
* Copyright: Microsoft 2015
*
* Basic options for ReSub.
*/
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("./lodashMini");
var OptionsVals = {
    setTimeout: setTimeout.bind(null),
    clearTimeout: clearTimeout.bind(null),
    shouldComponentUpdateComparator: _.isEqual.bind(_),
    development: typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
};
exports.default = OptionsVals;

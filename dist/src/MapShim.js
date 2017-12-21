"use strict";
/**
* MapShim.ts
* Author: David de Regt
* Copyright: Microsoft 2016
*
* ES6-compliant browsers/devices support a new construct called a Map.  This is like a standard hashmap dictionary, but supports
* a variety of key types (not limited to strings).  This class shims support for Maps on systems that don't have it.  Note that the
* lookup in the shim mode is a linear lookup, and hence quite slow, so be careful about using this class unless you absolutely
* have no other choice.
*/
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("./lodashMini");
var MapShim = /** @class */ (function () {
    function MapShim() {
        this._mapShimItems = [];
        this.size = 0;
    }
    MapShim.prototype.clear = function () {
        this._mapShimItems = [];
        this.size = 0;
    };
    MapShim.prototype.delete = function (key) {
        var index = _.findIndex(this._mapShimItems, function (item) { return item.key === key; });
        if (index === -1) {
            return false;
        }
        this._mapShimItems.splice(index, 1);
        this.size--;
        return true;
    };
    MapShim.prototype.forEach = function (callbackfn) {
        var _this = this;
        _.forEach(this._mapShimItems, function (item) { return callbackfn(item.value, item.key, _this); });
    };
    MapShim.prototype.get = function (key) {
        var index = _.findIndex(this._mapShimItems, function (item) { return item.key === key; });
        if (index === -1) {
            return undefined;
        }
        return this._mapShimItems[index].value;
    };
    MapShim.prototype.has = function (key) {
        return _.some(this._mapShimItems, function (item) { return item.key === key; });
    };
    MapShim.prototype.set = function (key, value) {
        var item = _.find(this._mapShimItems, function (item) { return item.key === key; });
        if (item) {
            item.value = value;
        }
        else {
            this._mapShimItems.push({ key: key, value: value });
            this.size++;
        }
        return this;
    };
    return MapShim;
}());
exports.default = (typeof Map !== 'undefined' ? Map : MapShim);

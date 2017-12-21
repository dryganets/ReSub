"use strict";
/**
* ReSub.ts
* Author: David de Regt
* Copyright: Microsoft 2016
*
* Shared basic types for ReSub.
*/
Object.defineProperty(exports, "__esModule", { value: true });
var ComponentBaseI = require("./ComponentBase");
var AutoSubscriptionsI = require("./AutoSubscriptions");
var StoreBaseI = require("./StoreBase");
var TypesI = require("./Types");
var OptionsI = require("./Options");
exports.ComponentBase = ComponentBaseI.ComponentBase;
exports.StoreBase = StoreBaseI.StoreBase;
exports.AutoSubscribeStore = AutoSubscriptionsI.AutoSubscribeStore;
exports.autoSubscribe = AutoSubscriptionsI.autoSubscribe;
exports.autoSubscribeWithKey = AutoSubscriptionsI.autoSubscribeWithKey;
exports.key = AutoSubscriptionsI.key;
exports.disableWarnings = AutoSubscriptionsI.disableWarnings;
exports.Options = OptionsI.default;
exports.Types = TypesI;

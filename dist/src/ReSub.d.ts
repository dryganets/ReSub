/**
* ReSub.ts
* Author: David de Regt
* Copyright: Microsoft 2016
*
* Shared basic types for ReSub.
*/
import ComponentBaseI = require('./ComponentBase');
import AutoSubscriptionsI = require('./AutoSubscriptions');
import StoreBaseI = require('./StoreBase');
import TypesI = require('./Types');
import OptionsI = require('./Options');
export declare const ComponentBase: typeof ComponentBaseI.ComponentBase;
export declare const StoreBase: typeof StoreBaseI.StoreBase;
export declare const AutoSubscribeStore: ClassDecorator;
export declare const autoSubscribe: MethodDecorator;
export declare const autoSubscribeWithKey: typeof AutoSubscriptionsI.autoSubscribeWithKey;
export declare const key: typeof AutoSubscriptionsI.key;
export declare const disableWarnings: typeof AutoSubscriptionsI.disableWarnings;
export declare const Options: OptionsI.IOptions;
export import Types = TypesI;

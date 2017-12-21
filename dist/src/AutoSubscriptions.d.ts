import { StoreBase } from './StoreBase';
export declare type InstanceTarget = {};
export interface AutoSubscribeHandler {
    handle(instance: InstanceTarget, store: StoreBase, key: string): void;
}
export declare function enableAutoSubscribeWrapper<T extends Function>(handler: AutoSubscribeHandler, existingMethod: T, thisArg: any): T;
export declare function forbidAutoSubscribeWrapper<T extends Function>(existingMethod: T, thisArg?: any): T;
export declare function enableAutoSubscribe(handler: AutoSubscribeHandler): MethodDecorator;
export declare var AutoSubscribeStore: ClassDecorator;
export declare var autoSubscribe: MethodDecorator;
export declare function autoSubscribeWithKey(keyOrKeys: string | number | (string | number)[]): MethodDecorator;
export declare function key(target: InstanceTarget, methodName: string, index: number): void;
export declare function disableWarnings<T extends Function>(target: InstanceTarget, methodName: string, descriptor: TypedPropertyDescriptor<T>): TypedPropertyDescriptor<T>;
export declare function warnIfAutoSubscribeEnabled<T extends Function>(target: InstanceTarget, methodName: string, descriptor: TypedPropertyDescriptor<T>): TypedPropertyDescriptor<T>;

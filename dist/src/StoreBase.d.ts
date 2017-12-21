import { SubscriptionCallbackFunction } from './Types';
export interface AutoSubscription {
    store: StoreBase;
    callback: () => void;
    key: string;
    used: boolean;
}
export declare abstract class StoreBase {
    static Key_All: string;
    private _subscriptions;
    private _autoSubscriptions;
    private _subTokenNum;
    private _subsByNum;
    storeId: string;
    private _gatheredCallbacks;
    private _throttleMs;
    private _throttleTimerId;
    private _bypassTriggerBlocks;
    private _triggerBlocked;
    private _isTriggering;
    private _triggerPending;
    private static _triggerBlockCount;
    private static _triggerBlockedStoreList;
    private static _pendingThrottledStores;
    private static _bypassThrottle;
    static pushTriggerBlock(): void;
    static popTriggerBlock(): void;
    static setThrottleStatus(enabled: boolean): void;
    constructor(throttleMs?: number, bypassTriggerBans?: boolean);
    protected trigger(keyOrKeys?: string | number | (string | number)[]): void;
    private _resolveThrottledCallbacks;
    subscribe(callback: SubscriptionCallbackFunction, rawKey?: string | number): number;
    unsubscribe(subToken: number): void;
    trackAutoSubscription(subscription: AutoSubscription): void;
    removeAutoSubscription(subscription: AutoSubscription): void;
    protected _startedTrackingKey(key: string): void;
    protected _stoppedTrackingKey(key: string): void;
    protected _getSubscriptionKeys(): string[];
    protected _isTrackingKey(key: string): boolean;
}

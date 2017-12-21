/// <reference types="react" />
import React = require('react');
import { StoreSubscription } from './Types';
export declare abstract class ComponentBase<P extends React.Props<any>, S extends Object> extends React.Component<P, S> {
    private _storeSubscriptions;
    private static _nextSubscriptionId;
    private _handledSubscriptions;
    private _handledAutoSubscriptions;
    private _handledSubscriptionsLookup;
    private _isMounted;
    constructor(props: P);
    protected _initStoreSubscriptions(): StoreSubscription<S>[];
    componentWillMount(): void;
    componentWillReceiveProps(nextProps: Readonly<P>, nextContext: any): void;
    componentWillUnmount(): void;
    componentWillUpdate(nextProps: Readonly<P>, nextState: Readonly<S>, nextContext: any): void;
    shouldComponentUpdate(nextProps: Readonly<P>, nextState: Readonly<S>, nextContext: any): boolean;
    isComponentMounted(): boolean;
    protected _addSubscription(subscription: StoreSubscription<S>): StoreSubscription<S> | undefined;
    protected _removeSubscription(subscription: StoreSubscription<S>): StoreSubscription<S>[];
    private _registerSubscription(subscription, key?);
    private _cleanupSubscription(subscription);
    private _shouldRemoveAndCleanupAutoSubscription(subscription);
    private _onSubscriptionChanged(subscription, changedItem);
    private _onAutoSubscriptionChanged;
    private _addSubscriptionToLookup(subscription);
    private _removeSubscriptionFromLookup(subscription);
    private _handleAutoSubscribe(store, key);
    private _hasMatchingSubscription(storeId, key);
    private _hasMatchingAutoSubscription(store, key);
    private static _autoSubscribeHandler;
    private _buildStateWithAutoSubscriptions(props, initialBuild);
    protected _buildState(props: P, initialBuild: boolean): Partial<S> | undefined;
    protected _buildInitialState(): Readonly<S>;
    componentDidMount(): void;
    componentDidUpdate(prevProps: Readonly<P>, prevState: S, prevContext: any): void;
    protected _componentDidRender(): void;
}
export default ComponentBase;

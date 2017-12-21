/**
* ComponentBase.ts
* Author: David de Regt
* Copyright: Microsoft 2016
*
* Base class for React components, adding in support for automatic store registration and unregistration.
*/
'use strict';
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var assert = require("assert");
var _ = require("./lodashMini");
var React = require("react");
var Options_1 = require("./Options");
var StoreBase_1 = require("./StoreBase");
var AutoSubscriptions_1 = require("./AutoSubscriptions");
// Subscriptions without a key need some way to be identified in the SubscriptionLookup.
var SubKeyNoKey = '%$^NONE';
var ComponentBase = /** @class */ (function (_super) {
    __extends(ComponentBase, _super);
    function ComponentBase(props) {
        var _this = _super.call(this, props) || this;
        _this._handledSubscriptions = {};
        _this._handledAutoSubscriptions = [];
        _this._handledSubscriptionsLookup = {};
        _this._isMounted = false;
        _this._onAutoSubscriptionChanged = function () {
            if (!_this.isComponentMounted()) {
                return;
            }
            var newState = _this._buildStateWithAutoSubscriptions(_this.props, false);
            if (newState && !_.isEmpty(newState)) {
                _this.setState(newState);
            }
        };
        var derivedClassRender = _this.render || _.noop;
        // No one should use Store getters in render: do that in _buildState instead.
        _this.render = AutoSubscriptions_1.forbidAutoSubscribeWrapper(function () {
            // Handle exceptions because otherwise React would break and the app would become unusable until refresh.
            try {
                return derivedClassRender.call(_this);
            }
            catch (e) {
                // Annoy devs so this gets fixed.
                if (Options_1.default.development) {
                    // tslint:disable-next-line
                    throw e;
                }
                // Try to move on.
                return null;
            }
        });
        return _this;
    }
    ComponentBase.prototype._initStoreSubscriptions = function () {
        return [];
    };
    // Subclasses may override, but _MUST_ call super.
    ComponentBase.prototype.componentWillMount = function () {
        this.setState(this._buildInitialState());
        this._isMounted = true;
    };
    // Subclasses may override, but _MUST_ call super.
    ComponentBase.prototype.componentWillReceiveProps = function (nextProps, nextContext) {
        var _this = this;
        _.forEach(this._handledSubscriptions, function (subscription) {
            if (subscription.keyPropertyName) {
                var curVal = _.get(_this.props, subscription.keyPropertyName);
                var nextVal = _.get(nextProps, subscription.keyPropertyName);
                if (curVal !== nextVal) {
                    // The property we care about changed, so unsubscribe and re-subscribe under the new value
                    _this._removeSubscriptionFromLookup(subscription);
                    _this._cleanupSubscription(subscription);
                    _this._registerSubscription(subscription, nextVal);
                    _this._addSubscriptionToLookup(subscription);
                }
            }
        });
        if (!Options_1.default.shouldComponentUpdateComparator(this.props, nextProps)) {
            var newState = this._buildStateWithAutoSubscriptions(nextProps, false);
            if (newState && !_.isEmpty(newState)) {
                this.setState(newState);
            }
        }
    };
    // Subclasses may override, but _MUST_ call super.
    ComponentBase.prototype.componentWillUnmount = function () {
        var _this = this;
        _.forEach(this._handledSubscriptions, function (subscription) {
            _this._cleanupSubscription(subscription);
        });
        this._handledSubscriptions = {};
        this._handledSubscriptionsLookup = {};
        // Remove and cleanup all suscriptions
        _.forEach(this._handledAutoSubscriptions, function (subscription) {
            subscription.used = false;
            subscription.store.removeAutoSubscription(subscription);
        });
        this._handledAutoSubscriptions = [];
        this._isMounted = false;
    };
    ComponentBase.prototype.componentWillUpdate = function (nextProps, nextState, nextContext) {
        // Do nothing, included so that there is no ambiguity on when a subclass must call super
    };
    ComponentBase.prototype.shouldComponentUpdate = function (nextProps, nextState, nextContext) {
        return !Options_1.default.shouldComponentUpdateComparator(this.state, nextState) ||
            !Options_1.default.shouldComponentUpdateComparator(this.props, nextProps);
    };
    ComponentBase.prototype.isComponentMounted = function () {
        return this._isMounted;
    };
    ComponentBase.prototype._addSubscription = function (subscription) {
        assert.ok(subscription.store instanceof StoreBase_1.StoreBase, 'Subscription added with store that\'s not an StoreBase');
        if (subscription.enablePropertyName) {
            var enabled = _.get(this.props, subscription.enablePropertyName);
            if (!enabled) {
                // Do not process subscription
                // TODO: save this subscription and try again when props change!
                return undefined;
            }
        }
        var nsubscription = _.extend(subscription, {
            // Wrap the given callback (if any) to provide extra functionality.
            _callback: subscription.callbackBuildState
                // The caller wants auto-subscriptions, so enable them for the duration of the given callback.
                ? AutoSubscriptions_1.enableAutoSubscribeWrapper(ComponentBase._autoSubscribeHandler, subscription.callbackBuildState, this)
                : subscription.callback
                    // The caller wants to take care of everything.
                    // Note: eating the return value so we do not later confuse it for a state update.
                    ? function (keys) { subscription.callback(keys); }
                    // Callback was not given.
                    : undefined,
            _lambda: _.bind(this._onSubscriptionChanged, this, subscription),
            _id: ComponentBase._nextSubscriptionId++
        });
        if (nsubscription.keyPropertyName) {
            var keyVal = _.get(this.props, nsubscription.keyPropertyName);
            assert.ok(typeof keyVal !== 'undefined', 'Subscription can\'t resolve key property: ' + nsubscription.keyPropertyName);
            this._registerSubscription(nsubscription, keyVal);
        }
        else if (nsubscription.specificKeyValue) {
            this._registerSubscription(nsubscription, nsubscription.specificKeyValue);
        }
        else {
            this._registerSubscription(nsubscription);
        }
        this._handledSubscriptions[nsubscription._id] = nsubscription;
        this._addSubscriptionToLookup(nsubscription);
        return subscription;
    };
    ComponentBase.prototype._removeSubscription = function (subscription) {
        var removed = [];
        var nsubscription = subscription;
        var removedExplicit = this._handledSubscriptions[nsubscription._id];
        if (removedExplicit) {
            removed.push(removedExplicit);
            this._cleanupSubscription(removedExplicit);
            delete this._handledSubscriptions[nsubscription._id];
        }
        this._removeSubscriptionFromLookup(subscription);
        return removed;
    };
    ComponentBase.prototype._registerSubscription = function (subscription, key) {
        if (key === void 0) { key = StoreBase_1.StoreBase.Key_All; }
        assert.ok(!subscription._subscriptionToken, 'Subscription already subscribed!');
        assert.ok(!subscription.keyPropertyName || key !== StoreBase_1.StoreBase.Key_All, 'Subscription created with key of all when it has a key property name');
        assert.notDeepEqual(subscription.specificKeyValue, StoreBase_1.StoreBase.Key_All, 'Subscription created with specific key of all');
        if (key) {
            if (_.isNumber(key)) {
                key = key.toString();
            }
            subscription._subscriptionToken = subscription.store.subscribe(subscription._lambda, key);
            subscription._subscriptionKey = key;
        }
        else {
            subscription._subscriptionKey = undefined;
        }
    };
    ComponentBase.prototype._cleanupSubscription = function (subscription) {
        if (subscription._subscriptionToken) {
            subscription.store.unsubscribe(subscription._subscriptionToken);
            subscription._subscriptionToken = undefined;
        }
    };
    ComponentBase.prototype._shouldRemoveAndCleanupAutoSubscription = function (subscription) {
        return !subscription.used;
    };
    ComponentBase.prototype._onSubscriptionChanged = function (subscription, changedItem) {
        // The only time we can get a subscription callback that's unmounted is after the component has already been
        // mounted and torn down, so this check can only catch that case (subscriptions living past the end of the
        // component's lifetime).
        if (!this.isComponentMounted()) {
            return;
        }
        var newState = undefined;
        var nsubscription = subscription;
        if (nsubscription._callback) {
            newState = nsubscription._callback(changedItem);
        }
        else {
            newState = this._buildStateWithAutoSubscriptions(this.props, false);
        }
        if (newState && !_.isEmpty(newState)) {
            this.setState(newState);
        }
    };
    ComponentBase.prototype._addSubscriptionToLookup = function (subscription) {
        var lookup = this._handledSubscriptionsLookup;
        var storeId = subscription.store.storeId;
        var key = subscription._subscriptionKey || SubKeyNoKey;
        if (!lookup[storeId]) {
            lookup[storeId] = {};
        }
        if (!lookup[storeId][key]) {
            lookup[storeId][key] = {};
        }
        lookup[storeId][key][subscription._id] = subscription;
    };
    ComponentBase.prototype._removeSubscriptionFromLookup = function (subscription) {
        var lookup = this._handledSubscriptionsLookup;
        var storeId = subscription.store.storeId;
        var key = subscription._subscriptionKey || SubKeyNoKey;
        if (lookup[storeId] && lookup[storeId][key] && lookup[storeId][key][subscription._id]) {
            delete lookup[storeId][key][subscription._id];
        }
    };
    ComponentBase.prototype._handleAutoSubscribe = function (store, key) {
        // Check for an existing auto-subscription.
        if (this._hasMatchingAutoSubscription(store, key)) {
            return;
        }
        // Check for an existing explicit subscription.
        if (this._hasMatchingSubscription(store.storeId, key)) {
            return;
        }
        // None found: auto-subscribe!
        var subscription = {
            store: store,
            // Note: an undefined specificKeyValue will use Key_All by default.
            key: key,
            callback: this._onAutoSubscriptionChanged,
            used: true
        };
        this._handledAutoSubscriptions.push(subscription);
        subscription.store.trackAutoSubscription(subscription);
    };
    // Check if we already handle a subscription (explicit) for storeId with key.
    ComponentBase.prototype._hasMatchingSubscription = function (storeId, key) {
        var _this = this;
        var subscriptionsWithStore = this._handledSubscriptionsLookup[storeId];
        if (subscriptionsWithStore) {
            var subscriptionsWithStoreAndKey = subscriptionsWithStore[key];
            var subscriptionsWithStoreAndKeyAll = subscriptionsWithStore[StoreBase_1.StoreBase.Key_All];
            if (!_.isEmpty(subscriptionsWithStoreAndKey) || !_.isEmpty(subscriptionsWithStoreAndKeyAll)) {
                // Already explicitly subscribed.
                return true;
            }
            var subscriptionsWithStoreAndPropName = subscriptionsWithStore[SubKeyNoKey];
            var matchingSubscription = _.find(subscriptionsWithStoreAndPropName, function (sub) {
                if (sub.keyPropertyName && (!sub.enablePropertyName || _.get(_this.props, sub.enablePropertyName))) {
                    var curVal = _.get(_this.props, sub.keyPropertyName);
                    return curVal === key;
                }
                // Subscribed to Key_All.
                return true;
            });
            if (matchingSubscription) {
                // Already explicitly subscribed.
                return true;
            }
        }
        return false;
    };
    // Check if we already handle a subscription (auto) for store with key.
    ComponentBase.prototype._hasMatchingAutoSubscription = function (store, key) {
        return _.some(this._handledAutoSubscriptions, function (sub) {
            if (sub.store.storeId === store.storeId && (sub.key === key || sub.key === StoreBase_1.StoreBase.Key_All)) {
                sub.used = true;
                return true;
            }
            return false;
        });
    };
    ComponentBase.prototype._buildStateWithAutoSubscriptions = function (props, initialBuild) {
        var _this = this;
        _.forEach(this._handledAutoSubscriptions, function (sub) {
            sub.used = false;
        });
        var state = this._buildState(props, initialBuild);
        _.remove(this._handledAutoSubscriptions, function (subscription) {
            if (_this._shouldRemoveAndCleanupAutoSubscription(subscription)) {
                subscription.store.removeAutoSubscription(subscription);
                return true;
            }
            return false;
        });
        return state;
    };
    // All but the simplest of components should implement this virtual function.  This function is called in 3 places
    // by the framework:
    // 1. In the component constructor, it's called with the initial props and initialBuild = true.  This is where you should set all
    //    initial state for your component.  In many cases this case needs no special casing whatsoever because the component always
    //    rebuilds all of its state from whatever the props are, whether it's an initial build or a new props received event.
    // 2. In the React lifecycle, during a componentWillReceiveProps, if the props change (determined by a _.isEqual), this is called
    //    so that the component can rebuild state from the new props.
    // 3. If the component subscribes to any stores via the ComponentBase subscription system, if a specific callback function is not
    //    specified, then this function is called whenever the subscription is triggered.  Basically, this should be used if there are
    //    no performance considerations with simply rebuilding the whole component whenever a subscription is triggered, which is
    //    very often the case.
    //
    // In the majority of cases, this turns into a simple function that doesn't care about initialBuild, and simply
    // rebuilds the whole state of the component whenever called.  This should usually only be made more specific if
    // there are performance considerations with over-rebuilding.
    ComponentBase.prototype._buildState = function (props, initialBuild) {
        return undefined;
    };
    // The initial state is unavailable in componentWillMount. Override this method to get access to it.
    // Subclasses may override, but _MUST_ call super.
    ComponentBase.prototype._buildInitialState = function () {
        var _this = this;
        this._storeSubscriptions = this._initStoreSubscriptions();
        _.forEach(this._storeSubscriptions, function (subscription) {
            _this._addSubscription(subscription);
        });
        // Initialize state
        return this._buildStateWithAutoSubscriptions(this.props, true) || {};
    };
    // Wrap both didMount and didUpdate into componentDidRender
    ComponentBase.prototype.componentDidMount = function () {
        this._componentDidRender();
    };
    ComponentBase.prototype.componentDidUpdate = function (prevProps, prevState, prevContext) {
        this._componentDidRender();
    };
    ComponentBase.prototype._componentDidRender = function () {
        // Virtual helper function to override as needed
    };
    ComponentBase._nextSubscriptionId = 1;
    // Hander for enableAutoSubscribe that does the actual auto-subscription work.
    ComponentBase._autoSubscribeHandler = {
        // Callback to handle the 'auto-subscribe'.
        handle: function (self, store, key) {
            self._handleAutoSubscribe(store, key);
        }
    };
    __decorate([
        AutoSubscriptions_1.enableAutoSubscribe(ComponentBase._autoSubscribeHandler)
    ], ComponentBase.prototype, "_buildStateWithAutoSubscriptions", null);
    return ComponentBase;
}(React.Component));
exports.ComponentBase = ComponentBase;
exports.default = ComponentBase;

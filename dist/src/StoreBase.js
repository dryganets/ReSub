"use strict";
/**
* StoreBase.ts
* Author: David de Regt
* Copyright: Microsoft 2015
*
* StoreBase acts as the base class to all stores.  Allows for pub/sub and event triggering at a variety of levels of the store.
* It also supports key triggering deferral and aggregation.  Stores can mark that they're okay getting delayed triggers for X ms,
* during which period the StoreBase gathers all incoming triggers and dedupes them, and releases them all at the same time at
* the end of the delay period.  You can also globally push a trigger-block onto a stack and if the stack is nonzero, then
* triggers will be queued for ALL stores until the block is popped, at which point all queued triggers will fire simultaneously.
* Stores can mark themselves as opt-out of the trigger-block logic for critical stores that must flow under all conditions.
*/
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("./lodashMini");
var assert = require("assert");
var MapShim_1 = require("./MapShim");
var Options_1 = require("./Options");
var StoreBase = /** @class */ (function () {
    function StoreBase(throttleMs, bypassTriggerBans) {
        if (throttleMs === void 0) { throttleMs = 0; }
        if (bypassTriggerBans === void 0) { bypassTriggerBans = false; }
        var _this = this;
        this._subscriptions = {};
        this._autoSubscriptions = {};
        this._subTokenNum = 1;
        this._subsByNum = {};
        this.storeId = _.uniqueId('store');
        this._gatheredCallbacks = new MapShim_1.default();
        this._triggerBlocked = false;
        this._isTriggering = false;
        this._triggerPending = false;
        this._resolveThrottledCallbacks = function () {
            // Prevent a store from trigginer while it's already in a trigger state
            if (_this._isTriggering) {
                _this._triggerPending = true;
                return;
            }
            // Clear a timer if one's still pending
            if (_this._throttleTimerId) {
                Options_1.default.clearTimeout(_this._throttleTimerId);
                _this._throttleTimerId = undefined;
                _.remove(StoreBase._pendingThrottledStores, _this);
            }
            if (StoreBase._triggerBlockCount > 0 && !_this._bypassTriggerBlocks) {
                // Trigger-blocked without a bypass flag.  Please wait until later.
                if (!_this._triggerBlocked) {
                    // Save this store to the global list that will be resolved when the block count is popped back to zero.
                    StoreBase._triggerBlockedStoreList.push(_this);
                    _this._triggerBlocked = true;
                }
                return;
            }
            _this._triggerBlocked = false;
            _this._isTriggering = true;
            _this._triggerPending = false;
            // Store the callbacks early, since calling callbacks may actually cause cascade changes to the subscription system and/or
            // pending callbacks.
            var storedCallbacks = _this._gatheredCallbacks;
            _this._gatheredCallbacks = new MapShim_1.default();
            storedCallbacks.forEach(function (keys, callback) {
                // Do a quick dedupe on keys
                var uniquedKeys = keys ? _.uniq(keys) : keys;
                // Convert null key (meaning "all") to undefined for the callback.
                callback(uniquedKeys || undefined);
            });
            _this._isTriggering = false;
            if (_this._triggerPending) {
                _this._resolveThrottledCallbacks();
            }
        };
        this._throttleMs = throttleMs;
        this._bypassTriggerBlocks = bypassTriggerBans;
    }
    StoreBase.pushTriggerBlock = function () {
        this._triggerBlockCount++;
    };
    StoreBase.popTriggerBlock = function () {
        this._triggerBlockCount--;
        assert.ok(this._triggerBlockCount >= 0, 'Over-popped trigger blocks!');
        if (this._triggerBlockCount === 0) {
            // Go through the list of stores awaiting resolution and resolve them all
            var awaitingList = this._triggerBlockedStoreList;
            this._triggerBlockedStoreList = [];
            _.forEach(awaitingList, function (store) {
                store._resolveThrottledCallbacks();
            });
        }
    };
    StoreBase.setThrottleStatus = function (enabled) {
        this._bypassThrottle = !enabled;
        // If we're going to bypass the throttle, trigger all pending stores now
        if (this._bypassThrottle) {
            var pendingThrottledStore = this._pendingThrottledStores.shift();
            while (!!pendingThrottledStore) {
                pendingThrottledStore._resolveThrottledCallbacks();
                pendingThrottledStore = this._pendingThrottledStores.shift();
            }
        }
    };
    // If you trigger a specific set of keys, then it will only trigger that specific set of callbacks (and subscriptions marked
    // as "All" keyed).  If the key is all, it will trigger all callbacks.
    StoreBase.prototype.trigger = function (keyOrKeys) {
        var _this = this;
        var keys;
        // trigger(0) is valid, ensure that we catch this case
        if (keyOrKeys || _.isNumber(keyOrKeys)) {
            keys = _.map(_.isArray(keyOrKeys) ? keyOrKeys : [keyOrKeys], function (key) { return _.isNumber(key) ? key.toString() : key; });
        }
        // Build a list of callbacks to call, trying to accumulate keys into a single callback set to avoid multiple callbacks
        // to the same target with different keys.
        if (!keys) {
            // Inspecific key, so generic callback call
            var allSubs = _.flatten(_.values(this._subscriptions));
            _.forEach(allSubs, function (callback) {
                // Clear the key list to null for the callback
                _this._gatheredCallbacks.set(callback, null);
            });
            _.forEach(_.flatten(_.values(this._autoSubscriptions)), function (sub) {
                _this._gatheredCallbacks.set(sub.callback, null);
            });
        }
        else {
            // Key list, so go through each key and queue up the callback
            _.forEach(keys, function (key) {
                _.forEach(_this._subscriptions[key], function (callback) {
                    var existingKeys = _this._gatheredCallbacks.get(callback);
                    if (existingKeys === undefined) {
                        _this._gatheredCallbacks.set(callback, [key]);
                    }
                    else if (existingKeys === null) {
                        // Do nothing since it's already an all-key-trigger
                    }
                    else {
                        // Add it to the end of the list
                        existingKeys.push(key);
                    }
                });
                _.forEach(_this._autoSubscriptions[key], function (sub) {
                    var existingKeys = _this._gatheredCallbacks.get(sub.callback);
                    if (existingKeys === undefined) {
                        _this._gatheredCallbacks.set(sub.callback, [key]);
                    }
                    else if (existingKeys === null) {
                        // Do nothing since it's already an all-key-trigger
                    }
                    else {
                        // Add it to the end of the list
                        existingKeys.push(key);
                    }
                });
            });
            // Go through each of the all-key subscriptions and add the full key list to their gathered list
            _.forEach(this._subscriptions[StoreBase.Key_All], function (callback) {
                var existingKeys = _this._gatheredCallbacks.get(callback);
                if (existingKeys === undefined) {
                    _this._gatheredCallbacks.set(callback, _.clone(keys));
                }
                else if (existingKeys === null) {
                    // Do nothing since it's already an all-key-trigger
                }
                else {
                    // Add them all to the end of the list
                    _.forEach(keys, function (key) {
                        existingKeys.push(key);
                    });
                }
            });
            _.forEach(this._autoSubscriptions[StoreBase.Key_All], function (sub) {
                var existingKeys = _this._gatheredCallbacks.get(sub.callback);
                if (existingKeys === undefined) {
                    _this._gatheredCallbacks.set(sub.callback, _.clone(keys));
                }
                else if (existingKeys === null) {
                    // Do nothing since it's already an all-key-trigger
                }
                else {
                    // Add them all to the end of the list
                    _.forEach(keys, function (key) {
                        existingKeys.push(key);
                    });
                }
            });
        }
        if (this._throttleMs && !StoreBase._bypassThrottle) {
            // Needs to accumulate and trigger later -- start a timer if we don't have one running already
            // If there are no callbacks, don't bother setting up the timer
            if (!this._throttleTimerId && this._gatheredCallbacks.size !== 0) {
                this._throttleTimerId = Options_1.default.setTimeout(this._resolveThrottledCallbacks, this._throttleMs);
            }
        }
        else {
            // No throttle timeout, so just resolve now
            this._resolveThrottledCallbacks();
        }
    };
    // Subscribe to triggered events from this store.  You can leave the default key, in which case you will be
    // notified of any triggered events, or you can use a key to filter it down to specific event keys you want.
    // Returns a token you can pass back to unsubscribe.
    StoreBase.prototype.subscribe = function (callback, rawKey) {
        if (rawKey === void 0) { rawKey = StoreBase.Key_All; }
        var key = _.isNumber(rawKey) ? rawKey.toString() : rawKey;
        // Adding extra type-checks since the key is often the result of following a string path, which is not type-safe.
        assert.ok(key && _.isString(key), 'Trying to subscribe to invalid key: "' + key + '"');
        var callbacks = this._subscriptions[key];
        if (!callbacks) {
            this._subscriptions[key] = [callback];
            if (key !== StoreBase.Key_All && !this._autoSubscriptions[key]) {
                this._startedTrackingKey(key);
            }
        }
        else {
            callbacks.push(callback);
        }
        var token = this._subTokenNum++;
        this._subsByNum[token] = { key: key, callback: callback };
        return token;
    };
    // Unsubscribe from a previous subscription.  Pass in the token the subscribe function handed you.
    StoreBase.prototype.unsubscribe = function (subToken) {
        assert.ok(this._subsByNum[subToken], 'No subscriptions found for token ' + subToken);
        var key = this._subsByNum[subToken].key;
        var callback = this._subsByNum[subToken].callback;
        delete this._subsByNum[subToken];
        // Remove this callback set from our tracking lists
        this._gatheredCallbacks.delete(callback);
        var callbacks = this._subscriptions[key];
        assert.ok(callbacks, 'No subscriptions under key ' + key);
        var index = _.indexOf(callbacks, callback);
        if (index !== -1) {
            callbacks.splice(index, 1);
            if (callbacks.length === 0) {
                // No more callbacks for key, so clear it out
                delete this._subscriptions[key];
                if (key !== StoreBase.Key_All && !this._autoSubscriptions[key]) {
                    this._stoppedTrackingKey(key);
                }
            }
        }
        else {
            assert.ok(false, 'Subscription not found during unsubscribe...');
        }
    };
    StoreBase.prototype.trackAutoSubscription = function (subscription) {
        var key = subscription.key;
        var callbacks = this._autoSubscriptions[key];
        if (!callbacks) {
            this._autoSubscriptions[key] = [subscription];
            if (key !== StoreBase.Key_All && !this._subscriptions[key]) {
                this._startedTrackingKey(key);
            }
        }
        else {
            callbacks.push(subscription);
        }
    };
    StoreBase.prototype.removeAutoSubscription = function (subscription) {
        var key = subscription.key;
        var subs = this._autoSubscriptions[key];
        assert.ok(subs, 'No subscriptions under key ' + key);
        var oldLength = subs.length;
        _.pull(subs, subscription);
        assert.equal(subs.length, oldLength - 1, 'Subscription not found during unsubscribe...');
        this._gatheredCallbacks.delete(subscription.callback);
        if (subs.length === 0) {
            // No more callbacks for key, so clear it out
            delete this._autoSubscriptions[key];
            if (key !== StoreBase.Key_All && !this._subscriptions[key]) {
                this._stoppedTrackingKey(key);
            }
        }
    };
    StoreBase.prototype._startedTrackingKey = function (key) {
        // Virtual function, noop default behavior
    };
    StoreBase.prototype._stoppedTrackingKey = function (key) {
        // Virtual function, noop default behavior
    };
    StoreBase.prototype._getSubscriptionKeys = function () {
        return _.union(_.keys(this._subscriptions), _.keys(this._autoSubscriptions));
    };
    StoreBase.prototype._isTrackingKey = function (key) {
        return !!this._subscriptions[key] || !!this._autoSubscriptions[key];
    };
    StoreBase.Key_All = '%!$all';
    StoreBase._triggerBlockCount = 0;
    StoreBase._triggerBlockedStoreList = [];
    StoreBase._pendingThrottledStores = [];
    StoreBase._bypassThrottle = false;
    return StoreBase;
}());
exports.StoreBase = StoreBase;

"use strict";
/**
 * AutoSubscribeTests.ts
 * Author: Mark Davis
 * Copyright: Microsoft 2016
 *
 * Tests auto-subscription behavior and provides an example for how to use auto-subscriptions in a store/component.
 */
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
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
var assert = require("assert");
var _ = require("lodash");
var React = require("react");
var TestUtils = require("react-dom/test-utils");
var ComponentBase_1 = require("../src/ComponentBase");
var AutoSubscriptions_1 = require("../src/AutoSubscriptions");
var StoreBase_1 = require("../src/StoreBase");
// Needs class decorator to support auto-subscriptions.
var SimpleStore = /** @class */ (function (_super) {
    __extends(SimpleStore, _super);
    function SimpleStore() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this._storeDataById = {};
        _this._subscribeWithKeyData = {
            A: 0,
            B: 0
        };
        _this._subscribeWithEnumKeyData = (_a = {},
            _a[0 /* First */] = 0,
            _a[1 /* Second */] = 0,
            _a);
        return _this;
        var _a;
    }
    // Auto-subscribes to Key_All (by default) since any change will affect the returned data.
    // Note: using the dangerous*Mutable convention since the returned data is not a copy.
    SimpleStore.prototype.dangerousGetAllStoreDataMutable = function () {
        return this._storeDataById;
    };
    // Auto-subscribes to the key given by 'id' (note: @key decorator on 'id') since only changes on that 'id' affects
    // the returned data.
    SimpleStore.prototype.getStoreData = function (id) {
        return this._get(id);
    };
    SimpleStore.prototype.getDataSingleKeyed = function () {
        return this._subscribeWithKeyData.A;
    };
    SimpleStore.prototype.getDataMultiKeyed = function () {
        return this._subscribeWithKeyData.A + this._subscribeWithKeyData.B;
    };
    SimpleStore.prototype.getDataSingleEnumKeyed = function () {
        return this._subscribeWithEnumKeyData[0 /* First */];
    };
    SimpleStore.prototype.getDataMultiEnumKeyed = function () {
        return this._subscribeWithEnumKeyData[0 /* First */] + this._subscribeWithEnumKeyData[1 /* Second */];
    };
    SimpleStore.prototype.setStoreDataForKeyedSubscription = function (key, data) {
        this._subscribeWithKeyData[key] = data;
        this.trigger(key);
    };
    SimpleStore.prototype.setStoreDataForEnumKeyedSubscription = function (key, data) {
        this._subscribeWithEnumKeyData[key] = data;
        this.trigger(key);
    };
    // Setters should not be called when auto-subscribe is enabled.
    // Note: @warnIfAutoSubscribeEnabled is automatically added (in debug mode) to any method missing @autoSubscribe
    // or @disableWarnings. That will catch the case where setters are called in a _buildState.
    SimpleStore.prototype.clearStoreData = function () {
        this._storeDataById = {};
    };
    // Note: explicitly adding decorator so the tests always works, even outside of debug mode. This is not necessary
    // in real stores, as explained above clearStoreData.
    SimpleStore.prototype.setStoreData = function (id, storeData) {
        var old = this._storeDataById[id];
        this._storeDataById[id] = storeData;
        if (!_.isEqual(old, storeData)) {
            this.trigger(id);
        }
    };
    // Internal methods to StoreBase are safe to call regardless of auto-subscribe, so disable any warnings.
    SimpleStore.prototype._getSubscriptionKeys = function () {
        var keys = _super.prototype._getSubscriptionKeys.call(this);
        assert.deepEqual(keys, _.uniq(keys), 'Internal failure: StoreBase should not report duplicate keys');
        return keys;
    };
    // No need to decorate private methods with @autoSubscribe or @disableWarnings. If auto-subscriptions are enabled
    // (e.g. from the _buildState of some component) then we can only reach here by being called from other public
    // methods (e.g. getStoreData), or protected methods on StoreBase. Thus only public/protected methods need the
    // appropriate decorator.
    // Note: @warnIfAutoSubscribeEnabled is automatically added (in debug mode) to this method, but that decorator does
    // nothing if another decorated method is calling this one (e.g. getStoreData).
    SimpleStore.prototype._get = function (id) {
        return this._storeDataById[id];
    };
    // Note: using test_* convention since it is only used for testing and breaks good practice otherwise.
    SimpleStore.prototype.test_getSubscriptionKeys = function () {
        return this._getSubscriptionKeys();
    };
    SimpleStore.prototype.test_getSubscriptions = function () {
        // Access private internal state of store
        return this._subscriptions;
    };
    SimpleStore.prototype.test_getAutoSubscriptions = function () {
        // Access private internal state of store
        return this._autoSubscriptions;
    };
    __decorate([
        AutoSubscriptions_1.autoSubscribe
    ], SimpleStore.prototype, "dangerousGetAllStoreDataMutable", null);
    __decorate([
        AutoSubscriptions_1.autoSubscribe,
        __param(0, AutoSubscriptions_1.key)
    ], SimpleStore.prototype, "getStoreData", null);
    __decorate([
        AutoSubscriptions_1.autoSubscribeWithKey('A')
    ], SimpleStore.prototype, "getDataSingleKeyed", null);
    __decorate([
        AutoSubscriptions_1.autoSubscribeWithKey(['A', 'B'])
    ], SimpleStore.prototype, "getDataMultiKeyed", null);
    __decorate([
        AutoSubscriptions_1.autoSubscribeWithKey(0 /* First */)
    ], SimpleStore.prototype, "getDataSingleEnumKeyed", null);
    __decorate([
        AutoSubscriptions_1.autoSubscribeWithKey([0 /* First */, 1 /* Second */])
    ], SimpleStore.prototype, "getDataMultiEnumKeyed", null);
    __decorate([
        AutoSubscriptions_1.warnIfAutoSubscribeEnabled
    ], SimpleStore.prototype, "setStoreData", null);
    __decorate([
        AutoSubscriptions_1.disableWarnings
    ], SimpleStore.prototype, "_getSubscriptionKeys", null);
    SimpleStore = __decorate([
        AutoSubscriptions_1.AutoSubscribeStore
    ], SimpleStore);
    return SimpleStore;
}(StoreBase_1.StoreBase));
// Instance of the SimpleStore used throughout the test. Re-created for each test.
var SimpleStoreInstance;
// Keys used in tests with special meanings that should not be used as string literals. In the typical case, use single
// letter strings for other keys, mainly the ones in initialStoreDatas.
var keys = {
    // The store does not start with data for this id, but might get some in the future.
    missing: 'missing',
    // The store has this key from the start, but components never ask for it (i.e. auto-subscribe to it) directly.
    // Thus, changes to this key will cause _buildState to be called iff a component is subscribed to Key_All.
    not_in_ids: '!ids',
    // Updated in _buildState to cause a warning.
    warn_in_build_state: 'build'
};
// Holds the next new unique StoreData value.
var uniqStoreDataValue = 1;
// Id and StoreData initially in the store (populated before each test).
var initialStoreDatas = (_a = {},
    _a[keys.not_in_ids] = uniqStoreDataValue++,
    // Do not include [key_missing] here.
    _a['a'] = uniqStoreDataValue++,
    _a['b'] = uniqStoreDataValue++,
    _a['c'] = uniqStoreDataValue++,
    _a['d'] = uniqStoreDataValue++,
    _a['e'] = uniqStoreDataValue++,
    _a);
var SimpleComponent = /** @class */ (function (_super) {
    __extends(SimpleComponent, _super);
    function SimpleComponent() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    // Note: _buildState is called from ComponentBase's constructor, when props change, and when a store triggers
    // for which this component is subscribed (e.g. SimpleStore).
    // Auto-subscriptions are enabled in _buildState due to ComponentBase.
    SimpleComponent.prototype._buildState = function (props, initialBuild) {
        var newState = {
            keyedDataSum: 0
        };
        if (props.test_useAll) {
            // Auto-subscribes to Key_All, even though we do not use the returned data.
            // Note: this line of code is an anit-pattern. Use explicit subscriptions (_initStoreSubscriptions()) instead.
            SimpleStoreInstance.dangerousGetAllStoreDataMutable();
        }
        if (props.test_causeWarning) {
            // Should cause a warning since setters are not allowed when auto-subscriptions are enabled.
            SimpleStoreInstance.setStoreData(keys.warn_in_build_state, uniqStoreDataValue++);
        }
        if (props.test_keyedSub) {
            newState.keyedDataSum = SimpleStoreInstance.getDataSingleKeyed() + SimpleStoreInstance.getDataMultiKeyed();
        }
        else if (props.test_enumKeyedSub) {
            newState.keyedDataSum = SimpleStoreInstance.getDataSingleEnumKeyed() + SimpleStoreInstance.getDataMultiEnumKeyed();
        }
        newState.storeDatas = _.map(props.ids, function (id) { return SimpleStoreInstance.getStoreData(id); });
        newState.stateChanges = initialBuild ? 1 : this.state.stateChanges + 1;
        return newState;
    };
    SimpleComponent.prototype.render = function () {
        return React.createElement("div", null, "Not testing render...");
    };
    return SimpleComponent;
}(ComponentBase_1.default));
// ----------------------------------------------------------------------------
// Tests for auto-subscriptions.
// Note: if an 'internal check' fails then the problem might be in the unit test itself, or in some other file.
describe('AutoSubscribeTests', function () {
    // Makes a new SimpleComponent and performs some internal checks.
    function makeComponent(props) {
        // Make the component, calling _buildState in the constructor.
        var component = TestUtils.renderIntoDocument(React.createElement(SimpleComponent, __assign({}, props)));
        // Internal check: state should have one change.
        assert.deepEqual(component.state.stateChanges, 1, 'Internal failure: state should have one change');
        // Internal check: state should have one StoreData per id in props.ids.
        assert.deepEqual(component.state.storeDatas.length, props.ids.length, 'Internal failure: state should have one StoreData per id in props.ids');
        // Internal check: state should have up-to-date StoreDatas held in the store.
        // Note: this might not be true in general, but only using auto-subscriptions should have that behavior.
        var storeDatasFromStore = _.map(props.ids, function (id) { return SimpleStoreInstance.getStoreData(id); });
        assert.deepEqual(component.state.storeDatas.sort(), storeDatasFromStore.sort(), 'Internal failure: state should have up-to-date StoreDatas');
        return component;
    }
    // The main tests for a component/store using auto-subscriptions.
    function testSubscriptions(component) {
        // Store should now have subscriptions. There were none at the start of the test, so they all came from this
        // component. If subscribed to Key_All, there should be one subscription. Otherwise, one per id in props.ids.
        var subscriptionKeys = SimpleStoreInstance.test_getSubscriptionKeys();
        if (component.props.test_useAll) {
            // The one and only subscription is to Key_All.
            assert.deepEqual(subscriptionKeys.length, 1, 'Should only have one subscription');
            assert.deepEqual(subscriptionKeys[0], StoreBase_1.StoreBase.Key_All, 'Should be subscribed to Key_All');
        }
        else {
            // Should be subscribed to each id in props.id, even if id is not in store._storeDataById currently
            // (e.g. keys.missing).
            assert.deepEqual(subscriptionKeys.sort(), _.uniq(component.props.ids).sort(), 'Should be subscribed to each id in props.id');
            // Should not be subscribed to Key_All if subscribed to other keys.
            // Note: this might not be true in general, especially if there are explicit subscriptions.
            assert.ok(!_.includes(subscriptionKeys, StoreBase_1.StoreBase.Key_All), 'Should not be subscribed to Key_All (in this case)');
        }
        // Auto-subscriptions should check for an existing subscription before adding a new one, thus there should
        // never be more than one auto-subscription for a key (per component).
        _.each(SimpleStoreInstance.test_getAutoSubscriptions(), function (subs, key) {
            assert.deepEqual(subs.length, 1, 'Should only have one auto-subscription callback');
        });
        assert.ok(_.isEmpty(SimpleStoreInstance.test_getSubscriptions()), 'Should have no explicit subscriptions');
    }
    // Tests if a change in the store causes the component to re-build its state, or not re-build if
    // doesNotAffectComponent is true.
    function testSubscriptionChange(component, idToChange, newValue, doesNotAffectComponent) {
        if (doesNotAffectComponent === void 0) { doesNotAffectComponent = false; }
        // Hold onto the current state before the store changes.
        var oldState = _.cloneDeep(component.state);
        // Trigger a change in the store.
        SimpleStoreInstance.setStoreData(idToChange, newValue);
        if (doesNotAffectComponent) {
            // There should be no change in the component.
            // Note: this will fail if _buildState was called because state.stateChanges always updates.
            assert.deepEqual(component.state, oldState, 'There should be no change in the component');
        }
        else {
            // Component state should change.
            assert.deepEqual(component.state.stateChanges, oldState.stateChanges + 1, 'Component state should have changed');
        }
        // Component state should have the up-to-date StoreDatas held in the store.
        // Note: even if doesNotAffectComponent is true, this assert.on is still valid.
        var storeDatasFromStore = _.map(component.props.ids, function (id) { return SimpleStoreInstance.getStoreData(id); });
        assert.deepEqual(component.state.storeDatas.sort(), storeDatasFromStore.sort(), 'Component state should have the up-to-date StoreDatas');
        // Re-run the subscription tests.
        testSubscriptions(component);
    }
    beforeEach(function () {
        // Create a new store with zero subscriptions.
        SimpleStoreInstance = new SimpleStore();
        // Populate the store with some data.
        _.each(initialStoreDatas, function (value, id) {
            SimpleStoreInstance.setStoreData(id, value);
        });
        // Internal check: the store should have no subscriptions.
        assert.deepEqual(SimpleStoreInstance.test_getSubscriptionKeys().length, 0, 'Internal failure: the store should have no subscriptions');
    });
    // ------------------------------------------------------------------------
    // Unit tests. Most of the logic is above.
    it('Auto-subscribe on id', function () {
        var component = makeComponent({ ids: ['a'] });
        testSubscriptions(component);
    });
    it('Auto-subscribe on multiple ids', function () {
        var component = makeComponent({ ids: ['a', 'b', 'c', 'd', 'e'] });
        testSubscriptions(component);
    });
    it('Auto-subscribe subscribes once per unique id', function () {
        var component = makeComponent({ ids: ['a', 'a', 'b', 'b'], test_useAll: true });
        testSubscriptions(component);
    });
    it('Auto-subscribe on id not already in store', function () {
        var component = makeComponent({ ids: [keys.missing] });
        testSubscriptions(component);
    });
    it('Auto-subscribe on Key_All', function () {
        var component = makeComponent({ ids: ['a', 'b'], test_useAll: true });
        testSubscriptions(component);
    });
    it('Auto-subscribe warns if setter is called in _buildState', function () {
        try {
            makeComponent({ ids: ['a'], test_causeWarning: true });
            assert.ok(false, 'Auto-subscription should have warned');
        }
        catch (e) {
            assert.ok(e.message, 'No exception message');
            assert.notDeepEqual(e.message.indexOf('@'), -1, 'Exception should be for auto-subscription, not something else');
            // Success: it warned.
        }
    });
    it('Auto-subscribe triggers _buildState on change', function () {
        var id = 'a';
        var component = makeComponent({ ids: [id] });
        testSubscriptions(component);
        testSubscriptionChange(component, id, uniqStoreDataValue++);
    });
    it('Auto-subscribe triggers _buildState on change multiple times', function () {
        var id1 = 'a';
        var id2 = 'b';
        var component = makeComponent({ ids: [id1, id2] });
        testSubscriptions(component);
        testSubscriptionChange(component, id1, uniqStoreDataValue++);
        // Make another change on the same id.
        testSubscriptionChange(component, id1, uniqStoreDataValue++);
        // Make another change on a different id.
        testSubscriptionChange(component, id2, uniqStoreDataValue++);
    });
    it('Auto-subscribe does NOT trigger _buildState on change to other id', function () {
        var component = makeComponent({ ids: ['a'] });
        testSubscriptions(component);
        testSubscriptionChange(component, keys.not_in_ids, uniqStoreDataValue++, /* doesNotAffectComponent */ true);
    });
    it('Auto-subscribe triggers _buildState on change to any id when subscribed to Key_All', function () {
        var component = makeComponent({ ids: ['a'], test_useAll: true });
        testSubscriptions(component);
        testSubscriptionChange(component, keys.not_in_ids, uniqStoreDataValue++);
    });
    it('Auto-subscribe triggers _buildState on change to id not initially in store', function () {
        // Tests a common case where some component is waiting for data the store does not already have, then the store
        // leter gets it and the component should update.
        var id = keys.missing;
        var component = makeComponent({ ids: [id] });
        testSubscriptions(component);
        // Component should only be subscribed to 'id' (i.e. not Key_All), so it should ignore keys.not_in_ids.
        testSubscriptionChange(component, keys.not_in_ids, uniqStoreDataValue++, /* doesNotAffectComponent */ true);
        // Add the missing data.
        testSubscriptionChange(component, id, uniqStoreDataValue++);
    });
    it('Auto-subscribe reuses subscription object', function () {
        // Tests a common case where some component is waiting for data the store does not already have, then the store
        // leter gets it and the component should update.
        var id1 = 'a';
        var id2 = 'b';
        var id3 = 'c';
        var component = makeComponent({ ids: [id1, id2, id2, id3, id3, id3] });
        testSubscriptions(component);
        var initialSubscriptions = _.clone(SimpleStoreInstance.test_getAutoSubscriptions());
        testSubscriptionChange(component, id1, uniqStoreDataValue++);
        testSubscriptionChange(component, id2, uniqStoreDataValue++);
        testSubscriptionChange(component, id2, uniqStoreDataValue++);
        testSubscriptionChange(component, id1, uniqStoreDataValue++);
        testSubscriptionChange(component, id3, uniqStoreDataValue++);
        testSubscriptionChange(component, id3, uniqStoreDataValue++);
        var updatedSubscriptions = SimpleStoreInstance.test_getAutoSubscriptions();
        assert.deepEqual(_.sortBy(_.keys(updatedSubscriptions), function (key) { return key; }), _.sortBy(_.keys(updatedSubscriptions), function (key) { return key; }), 'The set of auto-subscriptions changed');
        _.each(updatedSubscriptions, function (subs, key) {
            assert.equal(initialSubscriptions[key], subs, 'Auto-subscription was not re-used');
        });
    });
    it('autoSubscribeWithKey triggers _buildState on change', function () {
        var expectedState = 1;
        var component = makeComponent({ test_keyedSub: true, ids: [] });
        SimpleStoreInstance.setStoreDataForKeyedSubscription('A', 1);
        assert.deepEqual(component.state.stateChanges, ++expectedState, 'State change should have changed');
        assert.deepEqual(component.state.keyedDataSum, 2, 'Expected Sum incorrect');
        SimpleStoreInstance.setStoreDataForKeyedSubscription('B', 7);
        assert.deepEqual(component.state.stateChanges, ++expectedState, 'State change should have changed');
        assert.deepEqual(component.state.keyedDataSum, 9, 'Expected Sum incorrect');
        SimpleStoreInstance.setStoreDataForKeyedSubscription('A', 3);
        assert.deepEqual(component.state.stateChanges, ++expectedState, 'State change should have changed');
        assert.deepEqual(component.state.keyedDataSum, 13, 'Expected Sum incorrect');
    });
    it('autoSubscribeWithKey does not trigger _buildState on other subscription change', function () {
        var expectedState = 1;
        SimpleStoreInstance.setStoreDataForKeyedSubscription('A', 1);
        SimpleStoreInstance.setStoreDataForKeyedSubscription('B', 7);
        var component = makeComponent({ test_keyedSub: true, ids: [] });
        SimpleStoreInstance.setStoreData('foo', 77);
        assert.deepEqual(component.state.stateChanges, expectedState, 'State change should not have changed');
        assert.deepEqual(component.state.keyedDataSum, 9, 'Expected Sum incorrect');
    });
    it('autoSubscribeWithKey - test Enum Keyed Subscriptions', function () {
        var expectedState = 1;
        var component = makeComponent({ test_enumKeyedSub: true, ids: [] });
        SimpleStoreInstance.setStoreDataForEnumKeyedSubscription(0 /* First */, 1);
        assert.deepEqual(component.state.stateChanges, ++expectedState, 'State change should have changed');
        assert.deepEqual(component.state.keyedDataSum, 2, 'Expected Sum incorrect');
        SimpleStoreInstance.setStoreDataForEnumKeyedSubscription(1 /* Second */, 7);
        assert.deepEqual(component.state.stateChanges, ++expectedState, 'State change should have changed');
        assert.deepEqual(component.state.keyedDataSum, 9, 'Expected Sum incorrect');
        SimpleStoreInstance.setStoreDataForEnumKeyedSubscription(0 /* First */, 3);
        assert.deepEqual(component.state.stateChanges, ++expectedState, 'State change should have changed');
        assert.deepEqual(component.state.keyedDataSum, 13, 'Expected Sum incorrect');
    });
    it('Manual Subscription triggers', function () {
        var subToken1 = SimpleStoreInstance.subscribe(function (keys) {
            assert.equal(keys, 0 /* First */);
            SimpleStoreInstance.unsubscribe(subToken1);
        });
        SimpleStoreInstance.setStoreDataForEnumKeyedSubscription(0 /* First */, 1);
        var subToken2 = SimpleStoreInstance.subscribe(function (keys) {
            assert.equal(keys, 1 /* Second */);
            SimpleStoreInstance.unsubscribe(subToken2);
        });
        SimpleStoreInstance.setStoreDataForEnumKeyedSubscription(1 /* Second */, 1);
    });
});
var _a;

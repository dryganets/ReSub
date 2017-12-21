"use strict";
/**
 * StoreBaseTests.ts
 * Author: David de Regt
 * Copyright: Microsoft 2016
 *
 * Tests all the various expected behavior of StoreBase.
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
Object.defineProperty(exports, "__esModule", { value: true });
var assert = require("assert");
var _ = require("lodash");
var StoreBase_1 = require("../src/StoreBase");
var BraindeadStore = /** @class */ (function (_super) {
    __extends(BraindeadStore, _super);
    function BraindeadStore() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.Key_Something = 'abc';
        _this.Key_Something2 = 'def';
        _this.foundAll = false;
        _this.allKeys = undefined;
        _this.foundKey = false;
        _this.keyKeys = undefined;
        return _this;
    }
    BraindeadStore.prototype.setupSubs = function () {
        var _this = this;
        this.allSub = this.subscribe(function (keys) {
            _this.foundAll = true;
            _this.allKeys = keys;
        });
        this.keySub = this.subscribe(function (keys) {
            _this.foundKey = true;
            _this.keyKeys = keys;
        }, this.Key_Something);
    };
    BraindeadStore.prototype.emitAll = function () {
        this.trigger();
    };
    BraindeadStore.prototype.emitSomething = function () {
        this.trigger(this.Key_Something);
    };
    BraindeadStore.prototype.emitSomethings = function () {
        this.trigger([this.Key_Something, this.Key_Something2]);
    };
    return BraindeadStore;
}(StoreBase_1.StoreBase));
// ----------------------------------------------------------------------------
// Tests for auto-subscriptions.
// Note: if an 'internal check' fails then the problem might be in the unit test itself, or in some other file.
describe('StoreBaseTests', function () {
    it('Non-timed/Non-bypass Store', function () {
        var store = new BraindeadStore(0, false);
        store.setupSubs();
        // Try all emit
        store.emitAll();
        assert.ok(store.foundAll && store.foundKey);
        assert.equal(store.allKeys, undefined);
        assert.equal(store.keyKeys, undefined);
        store.foundAll = store.foundKey = false;
        store.allKeys = store.keyKeys = undefined;
        // Try keyed emit
        store.emitSomething();
        assert.ok(_.isEqual(store.allKeys, [store.Key_Something]));
        assert.ok(_.isEqual(store.keyKeys, [store.Key_Something]));
        assert.ok(store.foundAll && store.foundKey);
        store.foundAll = store.foundKey = false;
        store.allKeys = store.keyKeys = undefined;
        // Try keyed emits
        store.emitSomethings();
        assert.ok(_.isEqual(store.allKeys, [store.Key_Something, store.Key_Something2]));
        assert.ok(_.isEqual(store.keyKeys, [store.Key_Something]));
        assert.ok(store.foundAll && store.foundKey);
        store.foundAll = store.foundKey = false;
        store.allKeys = store.keyKeys = undefined;
        // block triggers
        StoreBase_1.StoreBase.pushTriggerBlock();
        store.emitAll();
        store.emitSomething();
        store.emitSomethings();
        assert.ok(!store.foundAll && !store.foundKey);
        // unblock and make sure the dedupe logic works (should just emit undefined, since we did an all emit,
        // which overrides the keyed ones)
        StoreBase_1.StoreBase.popTriggerBlock();
        assert.ok(_.isEqual(store.allKeys, undefined));
        assert.ok(_.isEqual(store.keyKeys, undefined));
        assert.ok(store.foundAll && store.foundKey);
        store.foundAll = store.foundKey = false;
        store.allKeys = store.keyKeys = undefined;
        // Make sure unsubscribe works
        store.unsubscribe(store.allSub);
        store.emitAll();
        assert.ok(!store.foundAll && store.foundKey);
        store.foundAll = store.foundKey = false;
        store.allKeys = store.keyKeys = undefined;
        store.unsubscribe(store.keySub);
        store.emitSomething();
        assert.ok(!store.foundAll && !store.foundKey);
    });
    it('Non-timed/Bypass Store', function () {
        var store = new BraindeadStore(0, true);
        store.setupSubs();
        // Try all emit
        store.emitAll();
        assert.ok(store.foundAll);
        assert.equal(store.allKeys, undefined);
        store.foundAll = false;
        store.allKeys = undefined;
        // block triggers, should do nothing (triggers should still flow)
        StoreBase_1.StoreBase.pushTriggerBlock();
        store.emitAll();
        assert.ok(store.foundAll);
        assert.equal(store.allKeys, undefined);
        store.foundAll = false;
        store.allKeys = undefined;
        // unblock and make sure nothing pops out
        StoreBase_1.StoreBase.popTriggerBlock();
        assert.ok(!store.foundAll);
    });
    it('Timed/non-Bypass Store', function (done) {
        var store = new BraindeadStore(100, false);
        store.setupSubs();
        // Try all emit -- should do nothing at the moment
        store.emitAll();
        assert.ok(!store.foundAll);
        _.delay(function () {
            if (store.foundAll) {
                done(false);
            }
        }, 10);
        _.delay(function () {
            assert.ok(store.foundAll);
            done();
        }, 200);
    });
    it('Double Trigger w/ Unsubscribe', function (done) {
        var store = new BraindeadStore();
        var callCount1 = 0;
        var token1 = store.subscribe(function () {
            callCount1++;
            store.unsubscribe(token1);
            store.emitAll();
        });
        var callCount2 = 0;
        var token2 = store.subscribe(function () {
            callCount2++;
            store.unsubscribe(token2);
            store.emitAll();
        });
        // Try all emit - Each subscription should the called once and the store should trigger multiple times
        store.emitAll();
        _.delay(function () {
            assert.equal(callCount1, 1);
            assert.equal(callCount2, 1);
            done();
        }, 100);
    });
});

/**
* Options.ts
* Author: David de Regt
* Copyright: Microsoft 2015
*
* Basic options for ReSub.
*/

import React = require('react');

import _ = require('./lodashMini');

export interface IOptions {
    // Use this to shim calls to setTimeout/clearTimeout with any other service/local function you want
    setTimeout: (callback: () => void, timeoutMs?: number) => number;
    clearTimeout: (id: number) => void;

    shouldComponentUpdateComparator: <T>(values: T, compareTo: T) => boolean;

    // Enables development mode -- more run-time checks.  By default, matches the NODE_ENV environment variable -- only set to true when
    // NODE_ENV is set and is set to something other than "production".
    development: boolean;

    reactOptions: ReactOptions;
}

interface IProcess {
    env: { NODE_ENV?: string };
}

export interface ReactOptions {
    setCallOnCreate(value: boolean): void;
    shouldCallOnCreate(): boolean;
}

class ReactOptionsDefault implements ReactOptions {
    private _reactCreateElement: Function| undefined;
    setCallOnCreate(value: boolean): void {
        if (value) {
            if (!this._reactCreateElement) {
                this._reactCreateElement = React.createElement;
                React.createElement = (type: any, props?: any, ...children: React.ReactNode[] ): any => {

                    let newType = type;
                    if (typeof type === 'function' && type.prototype) {
                        var set = {};     
                        // We need to have function name matching to the component name.            
                        set[type.name] = (props: any, context: any) => {
                            const obj = new type(props, context);
                            if (obj.onCreated) {
                                obj.onCreated();
                            }
                            return obj;
                        };
                        newType = set[type.name];
                        // Hook function is looks as a constructor for React now so it instantiates it correctly
                        newType.prototype = type.prototype;
                        // This is required field to copy
                        newType.childContextTypes = type.childContextTypes;
                    }
                    
                    return this._reactCreateElement!!!(newType, props, children);
                };
            }
        } else {
            if (this._reactCreateElement !== undefined) {
                const ReactAny = React as any;
                ReactAny.createElement = this._reactCreateElement;
                this._reactCreateElement = undefined;
            }
        }
    }

    shouldCallOnCreate(): boolean {
        return !this._reactCreateElement;
    }
}

function createReactOptions(): ReactOptions {
    return new ReactOptionsDefault();
}

declare var process: IProcess;

let OptionsVals: IOptions = {
    setTimeout: setTimeout.bind(null),
    clearTimeout: clearTimeout.bind(null),

    shouldComponentUpdateComparator: _.isEqual.bind(_),

    development: typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production',

    reactOptions: createReactOptions()

};

export default OptionsVals;

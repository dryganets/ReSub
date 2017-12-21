export interface Map<K, V> {
    clear(): void;
    delete(key: K): boolean;
    forEach(callbackfn: (value: V, index: K, map: Map<K, V>) => void): void;
    get(key: K): V | undefined;
    has(key: K): boolean;
    set(key: K, value: V): Map<K, V>;
    size: number;
}
export interface MapConstructor {
    new <K, V>(): Map<K, V>;
    prototype: Map<any, any>;
}
declare const _default: MapConstructor;
export default _default;

export interface IOptions {
    setTimeout: (callback: () => void, timeoutMs?: number) => number;
    clearTimeout: (id: number) => void;
    shouldComponentUpdateComparator: <T>(values: T, compareTo: T) => boolean;
    development: boolean;
}
declare let OptionsVals: IOptions;
export default OptionsVals;

import * as ts from 'typescript';
import { Rules, RuleFailure } from 'tslint';
export declare class Rule extends Rules.AbstractRule {
    apply(sourceFile: ts.SourceFile): RuleFailure[];
}

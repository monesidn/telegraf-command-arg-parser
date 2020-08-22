import { TokenWithIndexes } from 'power-split';
import { ParsedArgument } from './parsed-argument';

export interface ParserResult {
    result: ParsedArgument<any>;
    unconsumed: TokenWithIndexes[];
}

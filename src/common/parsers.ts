import { PowerSplit, TokenWithIndexes } from 'power-split';
import { ParsedArgument } from './parsed-argument';
import { ParserResult } from './parser-result';
import { ParsingErrors } from './parsing-errors';

export type NumberParser = (val: string) => number;

/**
 * This class provide common argument parser logic.
 */
export class Parsers {
    /**
     * Parse a number consuming one or more tokens.
     * @param tokens - Unparsed tokens.
     * @param min - Optional lower bound. If the parsed number is below the bound an error
     * is returned.
     * @param max - Optional upper bound. If the parsed number is below the bound an error
     * is returned.
     * @param strict - If set to false the parser will ignore some common mistake like (but not limited to):
     *  - a space between sign and number, commonly inserted by phone keyboards (eg "+ 5", "- 100"...)
     *  - one or more spaces between digits (eg 1 000 000 will be parsed as 1000000)
     * When not in strict mode the parser will try to consume all subsequent tokens that form
     * a valid number. Obviously strict parsing is faster but will degrade user experience.
     * @param parser - To parse numbers supporting different locales pass here a parser bound to the right
     * locale. I suggest using a globalize-generated number parser. By default (and to avoid extra dependancies)
     * the parser will use `(i) => +i`; that rely on javascript runtime settings.
     * @returns an object with a ParsedArgument and the remaining tokens.
     */
    static number(
        tokens: TokenWithIndexes[],
        min?: number,
        max?: number,
        strict = false,
        parser = (i: string) => +i
    ): ParserResult {
        if (!tokens || tokens.length === 0) {
            // Nothing to parse.
            return {
                result: ParsedArgument.error(ParsingErrors.MISSING),
                unconsumed: tokens
            };
        }

        let parsedNumber: number;
        let unconsumed: TokenWithIndexes[];
        let consumedUntil: TokenWithIndexes;

        if (strict) {
            parsedNumber = parser(tokens[0].token);
            consumedUntil = tokens[0];
            unconsumed = tokens.slice(1);
        } else {
            let lastValidIndex = undefined;
            let lastValidValue = undefined;
            for (let c = 0; c < tokens.length; c++) {
                // We try to parse a subsection of the array to check if it parsed to
                // a valid number.
                const parsed = parser(tokens.slice(0, c+1).map((i) => i.token).join(''));
                if (!isNaN(parsed)) {
                    // We found a valid number.
                    lastValidIndex = c;
                    lastValidValue = parsed;
                } else {
                    if (lastValidIndex)
                        break;
                }
            }

            if (lastValidIndex !== undefined) {
                parsedNumber = lastValidValue!;
                consumedUntil = tokens[lastValidIndex];
                unconsumed = tokens.slice(lastValidIndex+1);
            } else {
                parsedNumber = NaN;
                consumedUntil = tokens[0];
                unconsumed = tokens.slice(1);
            }
        }

        const consumedString = PowerSplit.substring(tokens[0], consumedUntil);

        if (isNaN(parsedNumber))
            return {
                result: ParsedArgument.error(ParsingErrors.SYNTAX_ERROR, consumedString),
                unconsumed
            };

        if ((min !== undefined && parsedNumber < min) || (max !== undefined && parsedNumber > max))
            return {
                result: ParsedArgument.error(ParsingErrors.OUT_OF_RANGE, consumedString),
                unconsumed
            };

        return {
            result: new ParsedArgument(parsedNumber, consumedString),
            unconsumed
        };
    }

    /**
     * Consume a token extracting a string.
     * @param tokens - Unparsed tokens.
     * @returns an object with a ParsedArgument and the remaining tokens.
     */
    static string(tokens: TokenWithIndexes[]): ParserResult {
        if (!tokens || tokens.length === 0) {
            // Nothing to parse.
            return {
                result: ParsedArgument.error(ParsingErrors.MISSING),
                unconsumed: tokens
            };
        }

        const result = tokens[0].token;
        return {
            result: new ParsedArgument(result, result),
            unconsumed: tokens.slice(1)
        };
    }

    /**
     * Extract a string only if listed in the accepted array. Optionally
     * the match can be case sensitive.
     * @param tokens - Unparsed tokens.
     * @param accepted - The accepted strings.
     * @param caseSensitive - If true (default) ignore case while searching for the value.
     * @returns an object with a ParsedArgument and the remaining tokens.
     */
    static oneOf(tokens: TokenWithIndexes[], accepted: string[], caseSensitive = true): ParserResult {
        if (!tokens || tokens.length === 0) {
            // Nothing to parse.
            return {
                result: ParsedArgument.error(ParsingErrors.MISSING),
                unconsumed: tokens
            };
        }

        const toParse = tokens[0].token;
        let item;
        if (caseSensitive) {
            item = accepted.includes(toParse) ? toParse : undefined;
        } else {
            item = accepted.find((i) => i.toLowerCase() === toParse.toLowerCase());
        }

        if (item)
            return {
                result: new ParsedArgument(item, toParse),
                unconsumed: tokens.slice(1)
            };

        return {
            result: ParsedArgument.error(ParsingErrors.VALUE_NOT_LISTED, toParse),
            unconsumed: tokens.slice(1)
        };
    }

    /**
     * Consumes all the remaining tokens and return them into a space-normalized
     * string.
     * @param tokens - Unparsed tokens.
     * @returns an object with a ParsedArgument and the remaining tokens.
     */
    static rest(tokens: TokenWithIndexes[]) {
        const normalized = tokens.map((i) => i.token).join(' ');
        const original = PowerSplit.substring(tokens[0]);
        return {
            result: new ParsedArgument(normalized, original),
            unconsumed: []
        };
    }
}

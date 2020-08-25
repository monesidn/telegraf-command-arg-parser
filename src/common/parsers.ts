import { PowerSplit, TokenWithIndexes } from 'power-split';
import { ParsedArgument } from './parsed-argument';
import { ParserResult } from './parser-result';
import { BasicParserCfg, NumberParserCfg, OneOfParserCfg } from './parsers-cfg';
import { ParsingErrors } from './parsing-errors';

export type NumberParser = (val: string) => number;

/**
 * This class provide common argument parser logic.
 */
export class Parsers {
    /**
     * Internal convenience method to return a ParserResult object.
     * @param value -
     * @param raw -
     * @param unconsumed -
     */
    private static result<T>(value: T, raw?: string, unconsumed: TokenWithIndexes[] = []): ParserResult {
        return { result: new ParsedArgument(value, raw), unconsumed };
    }

    /**
     * Internal convenience method to return a ParserResult error.
     * @param value -
     * @param raw -
     * @param unconsumed -
     */
    private static error<T>(error: ParsingErrors, raw?: string, unconsumed: TokenWithIndexes[] = []): ParserResult {
        return { result: ParsedArgument.error(error, raw), unconsumed };
    }

    /**
     * Parse a number consuming one or more tokens.
     * @param tokens - Unparsed tokens.
     * @param cfg - A configuration object.
     * @returns an object with a ParsedArgument and the remaining tokens.
     */
    static number(
        tokens: TokenWithIndexes[],
        cfg: NumberParserCfg
    ): ParserResult {
        if (!tokens || tokens.length === 0) {
            // Nothing to parse.
            if (cfg.default !== undefined)
                return this.result(cfg.default);

            return this.error(ParsingErrors.MISSING);
        }

        const { min, max, round, rejectFloats, strict } = cfg;
        const parser = cfg.parser || ((i) => +i);
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
                    if (parsed === lastValidValue) {
                        // To support parsers like parseInt that parse only the valid
                        // part we update lastValidIndex and lastValidValue only if the
                        // parsed value changed from previous iteractions. This way we
                        // will cosume only those parts that have an actual meaning.
                        continue;
                    }

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
            return this.error(ParsingErrors.SYNTAX_ERROR, consumedString, unconsumed);

        if ((min !== undefined && parsedNumber < min) || (max !== undefined && parsedNumber > max))
            return this.error(ParsingErrors.OUT_OF_RANGE, consumedString, unconsumed);

        if (rejectFloats && !Number.isInteger(parsedNumber))
            return this.error(ParsingErrors.FLOAT_REJECTED, consumedString, unconsumed);

        if (round) {
            parsedNumber = Math.round(parsedNumber);
        }

        return this.result(parsedNumber, consumedString, unconsumed);
    }

    /**
     * Consume a token extracting a string.
     * @param tokens - Unparsed tokens.
     * @returns an object with a ParsedArgument and the remaining tokens.
     */
    static string(tokens: TokenWithIndexes[], cfg: BasicParserCfg<string>): ParserResult {
        if (!tokens || tokens.length === 0) {
            // Nothing to parse.
            if (cfg.default !== undefined)
                return this.result(cfg.default);

            return this.error(ParsingErrors.MISSING);
        }

        const result = tokens[0].token;
        return this.result(result, result, tokens.slice(1));
    }

    /**
     * Extract a string only if listed in the accepted array. Optionally
     * the match can be case sensitive.
     * @param tokens - Unparsed tokens.
     * @returns an object with a ParsedArgument and the remaining tokens.
     */
    static oneOf(tokens: TokenWithIndexes[], cfg: OneOfParserCfg): ParserResult {
        if (!tokens || tokens.length === 0) {
            // Nothing to parse.
            if (cfg.default !== undefined)
                return this.result(cfg.default);

            return this.error(ParsingErrors.MISSING);
        }

        const accepted = cfg.accepted || [];
        const caseSensitive = cfg.caseSensitive === undefined ? true : cfg.caseSensitive;

        const toParse = tokens[0].token;
        let item;
        if (caseSensitive) {
            item = accepted.includes(toParse) ? toParse : undefined;
        } else {
            item = accepted.find((i) => i.toLowerCase() === toParse.toLowerCase());
        }

        if (item)
            return this.result(item, toParse, tokens.slice(1));

        return this.error(ParsingErrors.VALUE_NOT_LISTED, toParse, tokens.slice(1));
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

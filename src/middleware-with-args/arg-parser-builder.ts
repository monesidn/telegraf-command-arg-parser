import { PowerSplit, TokenWithIndexes } from 'power-split';
import { ParsedArgument } from '../common/parsed-argument';
import { ParsedCommand } from '../common/parsed-command';
import { ParserResult } from '../common/parser-result';
import { Parsers } from '../common/parsers';
import { NumberParserCfg } from './number-parser-cfg';

/**
 * Internal interface shaping a parser step.
 */
interface ArgParserStep {
    (tokens: TokenWithIndexes[]): ParserResult;
}

/**
 * Return type of the toParser() method.
 */
export interface CompiledBuilder {
    (input?: string): ParsedCommand;
}

/**
 * Utility class to declare arguments using a fluent interface.
 */
export class ArgParserBuilder {
    /**
     * Each declarated argument became a "step". Steps are
     * executed one after another consuming one or more tokens.
     */
    private steps: ArgParserStep[] = [];

    /**
     * Adds a parsing stage to extract a number.
     * @param cfg - Optional parser configuration.
     * @returns This builder instance for chaining calls.
     */
    public number(cfg: NumberParserCfg = {}) {
        this.steps.push((tokens: TokenWithIndexes[]) =>
            Parsers.number(tokens,
                cfg.min,
                cfg.max,
                cfg.strict,
                cfg.parser
            ));
        return this;
    }

    /**
     * Adds a parsing stage to extract a string.
     * @returns This builder instance for chaining calls.
     */
    public string() {
        this.steps.push((tokens: TokenWithIndexes[]) => Parsers.string(tokens));
        return this;
    }

    /**
     * Adds a parsing stage to extract a string from a set of accepted value.
     * @param values - Accepted values
     * @param caseSensitive - Whatever to use case-sensitive match (default: `false`)
     * @returns This builder instance for chaining calls.
     */
    public oneOf(values: string[], caseSensitive = false) {
        this.steps.push((tokens: TokenWithIndexes[]) => Parsers.oneOf(tokens, values, caseSensitive));
        return this;
    }

    /**
     * Adds a parsing stage to extract the remaining text not processed by other stages
     * @returns This builder instance for chaining calls.
     */
    public rest() {
        this.steps.push((tokens: TokenWithIndexes[]) => Parsers.rest(tokens));
        return this;
    }

    /**
     * Adds a custom step to the processing pipeline.
     * @param step - An implementation of ArgParserStep.
     * @returns This builder instance for chaining calls.
     */
    public custom(step: ArgParserStep) {
        this.steps.push(step);
        return this;
    }

    /**
     * Returns a function that when called with a command message returns
     * argument parsed accordingly to the built configuration.
     */
    toParser(): CompiledBuilder {
        const stepsCopy = [...this.steps];
        return (input = ''): ParsedCommand => {
            const tokens = PowerSplit.splitWithIndexes(input, /\s/gu);

            const command = tokens.shift()?.token || '';
            const args: ParsedArgument<any>[] = [];

            let remaining = tokens;
            for (const step of stepsCopy) {
                const result = step(remaining);
                args.push(result.result);
                remaining = result.unconsumed;
            }

            return { command, raw: input, args };
        };
    }
}

import { PowerSplit, TokenWithIndexes } from 'power-split';
import { MiddlewareFn } from 'telegraf/typings/composer';
import { TelegrafContext } from 'telegraf/typings/context';
import { ParsedArgument } from '../common/parsed-argument';
import { ParsedCommand } from '../common/parsed-command';
import { ParserResult } from '../common/parser-result';
import { Parsers } from '../common/parsers';
// eslint-disable-next-line max-len
import { BasicParserCfg, NumberParserCfg, OneOfParserCfg, validateNumberParserCfg, validateOneOfParserCfg } from '../common/parsers-cfg';
import { MiddlewareWithArgsFn } from './arg-parser-decorator';

/**
 * Internal interface shaping a parser step.
 */
interface ArgParserStep {
    (tokens: TokenWithIndexes[]): ParserResult;
}


/**
 * If one or more arguments are not parsed correctly what should we do?
 */
export enum OnErrorAction {
    /**
     * The error is ignored and the handler function is called normally. Use
     * this mode to handle errors manually.
     */
    IGNORE = 'IGNORE',

    /**
     * Don't call the handler at all but delegate to the next middleware in the
     * chain.
     */
    CALL_NEXT = 'CALL_NEXT'
}

/**
 * A built parser. This is the returned value of the `toParser()` function.
 */
export interface ArgParser {
    (message: string): ParsedCommand;
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
     * If configured call this function instead of the handler if
     * one or more arguments are invalid.
     */
    private onErrorHandler?: MiddlewareWithArgsFn<any>;

    /**
     * Adds a parsing stage to extract a number.
     * @param cfg - Optional parser configuration.
     * @returns This builder instance for chaining calls.
     */
    public number(cfg: NumberParserCfg = {}) {
        validateNumberParserCfg(cfg);
        this.steps.push((tokens: TokenWithIndexes[]) => Parsers.number(tokens, cfg));
        return this;
    }

    /**
     * Adds a parsing stage to extract a string.
     * @returns This builder instance for chaining calls.
     */
    public string(cfg: BasicParserCfg<string> = {}) {
        this.steps.push((tokens: TokenWithIndexes[]) => Parsers.string(tokens, cfg));
        return this;
    }

    /**
     * Adds a parsing stage to extract a string from a set of accepted value.
     * @param values - Accepted values
     * @param caseSensitive - Whatever to use case-sensitive match (default: `false`)
     * @returns This builder instance for chaining calls.
     */
    public oneOf(cfg: OneOfParserCfg) {
        validateOneOfParserCfg(cfg);
        this.steps.push((tokens: TokenWithIndexes[]) => Parsers.oneOf(tokens, cfg));
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
     * Provides a function to call if one or more arguments are invalid.
     * @param arg - What should we do upon error? Pass one of the default actions ({@link OnErrorAction})
     * or a custom handler function.
     * @returns This builder instance for chaining calls.
     */
    public onError<C extends TelegrafContext>(arg: OnErrorAction | MiddlewareWithArgsFn<C> = OnErrorAction.IGNORE) {
        if (arg === OnErrorAction.IGNORE) {
            this.onErrorHandler = undefined;
        } else if (arg === OnErrorAction.CALL_NEXT) {
            this.onErrorHandler = (ctx, args, next) => next();
        } else {
            this.onErrorHandler = arg;
        }
        return this;
    }

    /**
     * Returns a function that parses the given message accordingly to the configuration.
     * This function only parse the command line: any middleware-related processing (like the
     * onError Handler) is ignored.
     */
    toParser(): ArgParser {
        const stepsCopy = [...this.steps];
        return (message: string): ParsedCommand => {
            const tokens = PowerSplit.splitWithIndexes(message, /\s/gu);

            const command = tokens.shift()?.token || '';
            const args: ParsedArgument<any>[] = [];

            let remaining = tokens;
            for (const step of stepsCopy) {
                const result = step(remaining);
                args.push(result.result);
                remaining = result.unconsumed;
            }

            return { command, raw: message, args };
        };
    }

    /**
     * Returns a middleware that parse arguments and then, as configured
     * will:
     * - call the handler,
     * - call the error handler or
     * - call `next`
     * @param handler - The handler function that will be called when needed.
     * @param parser - An already built parser. If you called toParser() before and
     * wish to reuse the same settings pass the instance here to avoid duplicating the
     * object.
     */
    toMiddleware<C extends TelegrafContext>(
        handler: MiddlewareWithArgsFn<C>,
        parser = this.toParser()
    ): MiddlewareFn<C> {
        const errHandler = this.onErrorHandler;

        return (ctx: C, next: () => Promise<void>): void | Promise<unknown> => {
            const parsedCmd = parser(ctx.message?.text || '');

            if (errHandler) {
                if (parsedCmd.args.find((i) => !!i.error)) {
                    return errHandler(ctx, parsedCmd, next);
                }
            }
            return handler(ctx, parsedCmd, next);
        };
    }
}

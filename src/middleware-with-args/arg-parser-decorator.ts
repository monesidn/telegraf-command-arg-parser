import { MiddlewareFn } from 'telegraf/typings/composer';
import { TelegrafContext } from 'telegraf/typings/context';
import { ParsedCommand } from '../common/parsed-command';
import { ArgParserBuilder } from './arg-parser-builder';

/**
 * This interface defines the chape of a middleware function capable of receiving
 * arguments. Arguments are not stored into the context because when using the
 * decorator APIs arguments are middleware-scaped.
 */
export interface MiddlewareWithArgsFn<TContext extends TelegrafContext> {
    (ctx: TContext, args: ParsedCommand, next: () => Promise<void>): void | Promise<unknown>
}

/**
 * Defines a function that receive an argBuilder as arguments and configure it.
 */
export interface ArgParserBuilderConfigurer{
    (builder: ArgParserBuilder): void;
}

/**
 * Turns a middleware function capable of reading arguments into a telegraf-compliant
 * middleware.
 * @param argBuilder - A configured argument builder instance or a function that will
 * configure one.
 * @param handler - A MiddlewareFn that is able to read the parsed command.
 */
export function middlewareWithArgs<C extends TelegrafContext>(
    argBuilder: ArgParserBuilder | ArgParserBuilderConfigurer,
    handler: MiddlewareWithArgsFn<C>
): MiddlewareFn<C> {
    let middleware : MiddlewareFn<C>;
    if (argBuilder instanceof ArgParserBuilder) {
        middleware = argBuilder.toMiddleware(handler);
    } else {
        const builder = new ArgParserBuilder();
        argBuilder(builder);
        middleware = builder.toMiddleware(handler);
    }

    return middleware;
}

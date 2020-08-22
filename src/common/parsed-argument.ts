import { ParsingErrors } from './parsing-errors';


/**
 * A single parsed and casted argument.
 */
export class ParsedArgument<T> {
    /**
     * @param value - The casted value.
     * @param raw - The raw text that was parsed. If parsing failed can be undefined.
     * @param error - If an error occurred while parsing it will be available here.
     */
    constructor(
        public readonly value?: T,
        public readonly raw?: string,
        public readonly error?: ParsingErrors
    ) {
    }

    /**
     * Convenience static method to generate an object containing
     * an error.
     * @param error - The error code.
     * @param raw - if available the original string.
     * @returns The parsed argument.
     */
    static error(error: ParsingErrors, raw?: string) {
        return new ParsedArgument(undefined, raw, error);
    }
}

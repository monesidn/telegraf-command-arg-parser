/**
 * When parsing arguments one of the following error may occur.
 */
export enum ParsingErrors {
    /**
     * An expected argument is missing.
     */
    MISSING = 'MISSING',

    /**
     * Can't parse the value according to the given pattern. If a number was expected
     * and the parsed found something that isn't a number it's considered a syntax error
     * too.
     */
    SYNTAX_ERROR = 'SYNTAX_ERROR',

    /**
     * When parsing a number if a range constraint is provided the parsed number may
     * be out of range.
     */
    OUT_OF_RANGE = 'OUT_OF_RANGE',

    /**
     * When parsing a string and a set of allowed value is provided this error is
     * reported if the parsed value is not in the specified set.
     */
    VALUE_NOT_LISTED = 'VALUE_NOT_LISTED'
}

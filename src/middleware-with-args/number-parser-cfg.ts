
/**
 * Number parser configuration.
 */
export interface NumberParserCfg{
    /**
     * Optional lower bound. If the parsed number is below the bound an error
     * is returned.
     */
    min?: number;

    /**
     * Optional upper bound. If the parsed number is below the bound an error
     * is returned.
     */
    max?: number;

    // round?: boolean; // TODO

    // rejectFloats: boolean; // TODO

    /**
     * If set to false the parser will ignore some common mistake like (but not limited to):
     *  - a space between sign and number, commonly inserted by phone keyboards (eg "+ 5", "- 100"...)
     *  - one or more spaces between digits (eg 1 000 000 will be parsed as 1000000)
     * When not in strict mode the parser will try to consume all subsequent tokens that form
     * a valid number. Obviously strict parsing is faster but will degrade user experience.
     */
    strict?: boolean;

    /**
     * To parse numbers supporting different locales pass here a parser bound to the right
     * locale. I suggest using a globalize-generated number parser.
     *
     * By default (and to avoid extra dependancies) the parser will use `(i) => +i;`
     * that rely on javascript runtime settings.
     */
    parser?: (i: string) => number;
}

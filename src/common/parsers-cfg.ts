
/**
 * Basic parser configuration
 */
export interface BasicParserCfg<T>{
    /**
     * If the parser have nothing to parse (so it's going to return a MISSING error)
     * and a default value was provided then it will return that value (and no error).
     */
    default?: T;
}


/**
 * Number arguments parser configuration.
 */
export interface NumberParserCfg extends BasicParserCfg<number>{
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

    /**
     * Should the parsed value be rounded? Use this flag if you wish to receive
     * an integer number automatically recovering from a float input. If parse
     * error behaviour is preferred use the `rejectFloats` flag instead.
     */
    round?: boolean;

    /**
     * Set this flag to true if you wish for a parsing error to be issued when
     * a float number is parsed. This flag has priority over `round`
     */
    rejectFloats?: boolean;

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

/**
 * Validates a NumberParserCfg object. The validation is performed only
 * while configuring the builder not at every call.
 * @param cfg - The object to validate
 * @throws An error describing the problem.
 */
export const validateNumberParserCfg = (cfg: NumberParserCfg) => {
    if (cfg.min !== undefined && cfg.max !== undefined && cfg.min > cfg.max)
        throw new Error('min can not be greater than max!');

    if (cfg.default !== undefined) {
        if (cfg.min !== undefined && cfg.default < cfg.min)
            throw new Error('Default value should be greater than min');
        if (cfg.max !== undefined && cfg.default > cfg.max)
            throw new Error('Default value should be lesser than max');
    }
};

/**
 * OneOf argument parser configuration.
 */
export interface OneOfParserCfg extends BasicParserCfg<string>{

    /**
     * The list of accepted strings. Make sure that the default value, if any,
     * is picked among these.
     */
    accepted?: string[];

    /**
     *  If true (default) ignore case while searching for the value.
     */
    caseSensitive?: boolean;
}

/**
 * Validates a OneOfParserCfg object. The validation is performed only
 * while configuring the builder not at every call.
 * @param cfg - The object to validate
 * @throws An error describing the problem.
 */
export const validateOneOfParserCfg = (cfg: OneOfParserCfg) => {
    if (cfg.default) {
        if (!cfg.accepted || !cfg.accepted.includes(cfg.default))
            throw new Error(`The default value ${cfg.default} is not included into the accepted values!`);
    }
};

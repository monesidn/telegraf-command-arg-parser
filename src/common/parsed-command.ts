import { ParsedArgument } from './parsed-argument';

export interface ParsedCommand {
    /**
     * The parsed command string. This will include also the initial
     * "/".
     */
    readonly command: string;

    /**
     * The raw command received. This is the original, unparsed string
     * that was received as message.
     */
    readonly raw: string;

    /**
     * The parsed tokens.
     */
    readonly args: ParsedArgument<any>[];

}

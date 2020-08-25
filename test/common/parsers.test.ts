import { PowerSplit } from 'power-split';
import { Parsers } from '../../src/common/parsers';
import { ParsingErrors } from '../../src/common/parsing-errors';

describe('Number Parsing', () => {
    test('Empty input', async () => {
        const result = Parsers.number([], {});

        expect(result.unconsumed).toStrictEqual([]);
        expect(result.result.error).toBe(ParsingErrors.MISSING);
        expect(result.result.raw).toBe(undefined);
    });

    test('Empty input, with default', async () => {
        const result = Parsers.number([], { default: 6 });

        expect(result.unconsumed).toStrictEqual([]);
        expect(result.result.error).toBe(undefined);
        expect(result.result.raw).toBe(undefined);
        expect(result.result.value).toBe(6);
    });

    test('Strict mode, valid number. Positive', async () => {
        const input = `+1000`;
        const result = Parsers.number(PowerSplit.splitWithIndexes(input, /\s+/gu), { strict: true });

        expect(result.unconsumed).toStrictEqual([]);
        expect(result.result.error).toBe(undefined);
        expect(result.result.raw).toBe(input);
        expect(result.result.value).toBe(1000);
    });

    test('Strict mode, valid number. Negative', async () => {
        const input = `-1000`;
        const result = Parsers.number(PowerSplit.splitWithIndexes(input, /\s+/gu), { strict: true });

        expect(result.unconsumed).toStrictEqual([]);
        expect(result.result.error).toBe(undefined);
        expect(result.result.raw).toBe(input);
        expect(result.result.value).toBe(-1000);
    });

    test('Strict mode, valid number. No sign', async () => {
        const input = `1000`;
        const result = Parsers.number(PowerSplit.splitWithIndexes(input, /\s+/gu), { strict: true });

        expect(result.unconsumed).toStrictEqual([]);
        expect(result.result.error).toBe(undefined);
        expect(result.result.raw).toBe(input);
        expect(result.result.value).toBe(1000);
    });

    test('Strict mode, invalid number', async () => {
        const input = `foooo`;
        const result = Parsers.number(PowerSplit.splitWithIndexes(input, /\s+/gu), { strict: true });

        expect(result.unconsumed).toStrictEqual([]);
        expect(result.result.error).toBe(ParsingErrors.SYNTAX_ERROR);
        expect(result.result.raw).toBe(input);
        expect(result.result.value).toBe(undefined);
    });

    test('Strict mode, valid number. Other args', async () => {
        const input = `1000 foo bar`;
        const splitted = PowerSplit.splitWithIndexes(input, /\s+/gu);
        const result = Parsers.number(splitted, { strict: true });

        expect(result.unconsumed).toStrictEqual(splitted.slice(1));
        expect(result.result.error).toBe(undefined);
        expect(result.result.raw).toBe(splitted[0].token);
        expect(result.result.value).toBe(1000);
    });

    test('Strict mode, invalid number. Other args', async () => {
        const input = `hello foo bar`;
        const splitted = PowerSplit.splitWithIndexes(input, /\s+/gu);
        const result = Parsers.number(splitted, { strict: true });

        expect(result.unconsumed).toStrictEqual(splitted.slice(1));
        expect(result.result.error).toBe(ParsingErrors.SYNTAX_ERROR);
        expect(result.result.raw).toBe(splitted[0].token);
        expect(result.result.value).toBe(undefined);
    });

    test('Normal mode, valid number.', async () => {
        const input = `+1000`;
        const splitted = PowerSplit.splitWithIndexes(input, /\s+/gu);
        const result = Parsers.number(splitted, {});

        expect(result.unconsumed).toStrictEqual([]);
        expect(result.result.error).toBe(undefined);
        expect(result.result.raw).toBe(input);
        expect(result.result.value).toBe(1000);
    });

    test('Normal mode, valid number, spaced.', async () => {
        const input = `+ 1 000`;
        const splitted = PowerSplit.splitWithIndexes(input, /\s+/gu);
        const result = Parsers.number(splitted, {});

        expect(result.unconsumed).toStrictEqual([]);
        expect(result.result.error).toBe(undefined);
        expect(result.result.raw).toBe(input);
        expect(result.result.value).toBe(1000);
    });

    test('Normal mode, valid number, spaced, negative.', async () => {
        const input = `- 1 000`;
        const splitted = PowerSplit.splitWithIndexes(input, /\s+/gu);
        const result = Parsers.number(splitted, {});

        expect(result.unconsumed).toStrictEqual([]);
        expect(result.result.error).toBe(undefined);
        expect(result.result.raw).toBe(input);
        expect(result.result.value).toBe(-1000);
    });

    test('Normal mode, valid number, spaced, other arguments', async () => {
        const input = `1 000 foo bar`;
        const splitted = PowerSplit.splitWithIndexes(input, /\s+/gu);
        const result = Parsers.number(splitted, {});

        expect(result.unconsumed).toStrictEqual(splitted.slice(2));
        expect(result.result.error).toBe(undefined);
        expect(result.result.raw).toBe(PowerSplit.substring(splitted[0], splitted[1]));
        expect(result.result.value).toBe(1000);
    });

    test('Normal mode, valid number, spaced, negative, other arguments', async () => {
        const input = `- 1 000 foo bar`;
        const splitted = PowerSplit.splitWithIndexes(input, /\s+/gu);
        const result = Parsers.number(splitted, {});

        expect(result.unconsumed).toStrictEqual(splitted.slice(3));
        expect(result.result.error).toBe(undefined);
        expect(result.result.raw).toBe(PowerSplit.substring(splitted[0], splitted[2]));
        expect(result.result.value).toBe(-1000);
    });

    test('Normal mode, invalid number.', async () => {
        const input = `Hello foo bar`;
        const splitted = PowerSplit.splitWithIndexes(input, /\s+/gu);
        const result = Parsers.number(splitted, {});

        expect(result.unconsumed).toStrictEqual(splitted.slice(1));
        expect(result.result.error).toBe(ParsingErrors.SYNTAX_ERROR);
        expect(result.result.raw).toBe(splitted[0].token);
        expect(result.result.value).toBe(undefined);
    });

    test('Normal mode, valid number, below min.', async () => {
        const input = `- 1 000 foo bar`;
        const splitted = PowerSplit.splitWithIndexes(input, /\s+/gu);
        const result = Parsers.number(splitted, { min: 0 });

        expect(result.unconsumed).toStrictEqual(splitted.slice(3));
        expect(result.result.error).toBe(ParsingErrors.OUT_OF_RANGE);
        expect(result.result.raw).toBe(PowerSplit.substring(splitted[0], splitted[2]));
        expect(result.result.value).toBe(undefined);
    });

    test('Normal mode, valid number, above max.', async () => {
        const input = `1 000 foo bar`;
        const splitted = PowerSplit.splitWithIndexes(input, /\s+/gu);
        const result = Parsers.number(splitted, { min: 0, max: 100 });

        expect(result.unconsumed).toStrictEqual(splitted.slice(2));
        expect(result.result.error).toBe(ParsingErrors.OUT_OF_RANGE);
        expect(result.result.raw).toBe(PowerSplit.substring(splitted[0], splitted[1]));
        expect(result.result.value).toBe(undefined);
    });

    test('Normal mode, valid number, equal to min.', async () => {
        const input = `0 foo bar`;
        const splitted = PowerSplit.splitWithIndexes(input, /\s+/gu);
        const result = Parsers.number(splitted, { min: 0, max: 100 });

        expect(result.unconsumed).toStrictEqual(splitted.slice(1));
        expect(result.result.error).toBe(undefined);
        expect(result.result.raw).toBe(splitted[0].token);
        expect(result.result.value).toBe(0);
    });

    test('Normal mode, valid number, equal to max.', async () => {
        const input = `100 foo bar`;
        const splitted = PowerSplit.splitWithIndexes(input, /\s+/gu);
        const result = Parsers.number(splitted, { min: 0, max: 100 });

        expect(result.unconsumed).toStrictEqual(splitted.slice(1));
        expect(result.result.error).toBe(undefined);
        expect(result.result.raw).toBe(splitted[0].token);
        expect(result.result.value).toBe(100);
    });

    test('Normal mode, valid number, using parseInt, other tokens.', async () => {
        const input = `100 foo bar`;
        const splitted = PowerSplit.splitWithIndexes(input, /\s+/gu);
        const result = Parsers.number(splitted, { parser: parseInt });

        expect(result.unconsumed).toStrictEqual(splitted.slice(1));
        expect(result.result.error).toBe(undefined);
        expect(result.result.raw).toBe(splitted[0].token);
        expect(result.result.value).toBe(100);
    });

    test('Normal mode, multi token number, valid number, using parseInt, other tokens.', async () => {
        const input = `100 000 foo bar`;
        const splitted = PowerSplit.splitWithIndexes(input, /\s+/gu);
        const result = Parsers.number(splitted, { parser: parseInt });

        expect(result.unconsumed).toStrictEqual(splitted.slice(2));
        expect(result.result.error).toBe(undefined);
        expect(result.result.raw).toBe(PowerSplit.substring(splitted[0], splitted[1]));
        expect(result.result.value).toBe(100000);
    });

    test('rejectFloat. Float input', async () => {
        const input = `100.1`;
        const splitted = PowerSplit.splitWithIndexes(input, /\s+/gu);
        const result = Parsers.number(splitted, { rejectFloats: true });

        expect(result.unconsumed).toStrictEqual([]);
        expect(result.result.error).toBe(ParsingErrors.FLOAT_REJECTED);
        expect(result.result.raw).toBe(input);
        expect(result.result.value).toBe(undefined);
    });

    test('rejectFloat. Integer input', async () => {
        const input = `100`;
        const splitted = PowerSplit.splitWithIndexes(input, /\s+/gu);
        const result = Parsers.number(splitted, { rejectFloats: true });

        expect(result.unconsumed).toStrictEqual([]);
        expect(result.result.error).toBe(undefined);
        expect(result.result.raw).toBe(input);
        expect(result.result.value).toBe(100);
    });

    test('round. Float input', async () => {
        const input = `100.1`;
        const splitted = PowerSplit.splitWithIndexes(input, /\s+/gu);
        const result = Parsers.number(splitted, { round: true });

        expect(result.unconsumed).toStrictEqual([]);
        expect(result.result.error).toBe(undefined);
        expect(result.result.raw).toBe(input);
        expect(result.result.value).toBe(100);
    });

    test('round. Integer input', async () => {
        const input = `100`;
        const splitted = PowerSplit.splitWithIndexes(input, /\s+/gu);
        const result = Parsers.number(splitted, { round: true });

        expect(result.unconsumed).toStrictEqual([]);
        expect(result.result.error).toBe(undefined);
        expect(result.result.raw).toBe(input);
        expect(result.result.value).toBe(100);
    });
});


describe('String Parsing', () => {
    test('Empty input', async () => {
        const result = Parsers.string([], {});

        expect(result.unconsumed).toStrictEqual([]);
        expect(result.result.error).toBe(ParsingErrors.MISSING);
        expect(result.result.raw).toBe(undefined);
        expect(result.result.value).toBe(undefined);
    });

    test('Empty input, with default', async () => {
        const foobar = 'foobar';
        const result = Parsers.string([], { default: foobar });

        expect(result.unconsumed).toStrictEqual([]);
        expect(result.result.error).toBe(undefined);
        expect(result.result.raw).toBe(undefined);
        expect(result.result.value).toBe(foobar);
    });

    test('Simple string', async () => {
        const input = `Hello foo bar`;
        const splitted = PowerSplit.splitWithIndexes(input, /\s+/gu);
        const result = Parsers.string(splitted, {});

        expect(result.unconsumed).toStrictEqual(splitted.slice(1));
        expect(result.result.error).toBe(undefined);
        expect(result.result.raw).toBe(splitted[0].token);
        expect(result.result.value).toBe('Hello');
    });
});

describe('oneOf Parsing', () => {
    const values = ['ONE', 'TWO', 'THREE'];

    test('Empty input', async () => {
        const result = Parsers.oneOf([], { accepted: values });

        expect(result.unconsumed).toStrictEqual([]);
        expect(result.result.error).toBe(ParsingErrors.MISSING);
        expect(result.result.raw).toBe(undefined);
        expect(result.result.value).toBe(undefined);
    });

    test('Empty input, with default', async () => {
        const result = Parsers.string([], { default: values[0] });

        expect(result.unconsumed).toStrictEqual([]);
        expect(result.result.error).toBe(undefined);
        expect(result.result.raw).toBe(undefined);
        expect(result.result.value).toBe(values[0]);
    });

    test('Invalid value', async () => {
        const input = `Hello foo bar`;
        const splitted = PowerSplit.splitWithIndexes(input, /\s+/gu);
        const result = Parsers.oneOf(splitted, { accepted: values });

        expect(result.unconsumed).toStrictEqual(splitted.slice(1));
        expect(result.result.error).toBe(ParsingErrors.VALUE_NOT_LISTED);
        expect(result.result.raw).toBe(splitted[0].token);
        expect(result.result.value).toBe(undefined);
    });

    test('Valid value, bad case', async () => {
        const input = `One foo bar`;
        const splitted = PowerSplit.splitWithIndexes(input, /\s+/gu);
        const result = Parsers.oneOf(splitted, { accepted: values, caseSensitive: true });

        expect(result.unconsumed).toStrictEqual(splitted.slice(1));
        expect(result.result.error).toBe(ParsingErrors.VALUE_NOT_LISTED);
        expect(result.result.raw).toBe(splitted[0].token);
        expect(result.result.value).toBe(undefined);
    });

    test('Valid value, right case', async () => {
        const input = `ONE foo bar`;
        const splitted = PowerSplit.splitWithIndexes(input, /\s+/gu);
        const result = Parsers.oneOf(splitted, { accepted: values, caseSensitive: false });

        expect(result.unconsumed).toStrictEqual(splitted.slice(1));
        expect(result.result.error).toBe(undefined);
        expect(result.result.raw).toBe(splitted[0].token);
        expect(result.result.value).toBe('ONE');
    });

    test('Valid value, bad case, case insensitve', async () => {
        const input = `One foo bar`;
        const splitted = PowerSplit.splitWithIndexes(input, /\s+/gu);
        const result = Parsers.oneOf(splitted, { accepted: values, caseSensitive: false });

        expect(result.unconsumed).toStrictEqual(splitted.slice(1));
        expect(result.result.error).toBe(undefined);
        expect(result.result.raw).toBe(splitted[0].token);
        expect(result.result.value).toBe('ONE');
    });
});


describe('rest Parsing', () => {
    test('Empty input', async () => {
        const result = Parsers.rest([]);

        expect(result.unconsumed).toStrictEqual([]);
        expect(result.result.error).toBe(undefined);
        expect(result.result.raw).toBe('');
        expect(result.result.value).toBe('');
    });

    test('A string', async () => {
        const input = `Hello foo bar`;
        const splitted = PowerSplit.splitWithIndexes(input, /\s+/gu);
        const result = Parsers.rest(splitted);

        expect(result.unconsumed).toStrictEqual([]);
        expect(result.result.error).toBe(undefined);
        expect(result.result.raw).toBe(input);
        expect(result.result.value).toBe(input);
    });
});

# telegraf-command-arg-parser
_It's dangerous to parse telegraf commands arguments alone, take this!_

This repo is an effort to write a generalized, production ready and easy to use solution to the problem of parsing arguments out of a message received using telegraf.js

## Why?
Sometimes its easier to allow a bot to read an argument out of the command message in place of using keyboard or an inline query. Using this middleware you can make this process easier and type-safe. 

## How? 
Technically speaking this library is more an adapter than a middleware, it wraps your command middleware into an adapter responsible for parsing arguments according to the given specification. 

Anyway it's easier to see it in action:

**Before** 
```typescript
telegraf.command('roll', (ctx) => {
    const num = +(ctx.message.text.split(/\s+/g)[1]);
    if (isNaN(num) || num < 2 || num > 100) {
        ctx.reply('Pick a number between 2 e 100');
        return;
    }
    ctx.reply('' + _.random(1, num));
}); 
```
This code works but has a few design flaws:
- the code to parse and validate the arguments is imperative;
- the code needs to be rewritten, or heavily refactored, to add a new argument or change the order;
- each data type need some ad-hoc validation (btw you can still refactor it in an utility class);
- you need to add an `if` for each invalid case.

telegraf-command-arg-parser aim to provide an easy-to-use solution to these problems.

**With telegraf-command-arg-parser**
```typescript
telegraf.command('roll', middlewareWithArgs(
    (builder) => builder.number({ min: 2, max: 100 })
                        .onError((ctx) => ctx.reply('Pick a number between 2 and 100')),

    (ctx, parsed) => {
        ctx.reply('' + _.random(1, parsed.args[0].value));
    }
));
```
As you can see:
- What are the arguments (only one in this case) is declared with a fluent interface.
- Need a new argument? call the right builder method chaining!
- Validation is performed by the library, command logic is not polluted!
- No if needed! A different function will handle the error! Btw this can be configured and you can still handle it manually if you wish.
- The handler take a `ParsedCommand` object that provides the result of the parsing process and that can be used to fetch argument values. 

### Why not adding arguments to Context?
While telegraf recommends extending the context I choosed to avoid it. The reason is that the context is shared between middlewares while arguments are specific to a single one. Adding parse result to the context would leak the ParsedCommand object to the next middleware. 

Obviously I know that a middleware registered using `.command()` should not call `next()` but still I didn't want to force it. If you think there is a good reason to change this design please open an issue and explain your reasons.

## Documentation
The code is fully documented using the tsdoc spec and I've set up a gitpage site hosting it. You can find it here: 
https://monesidn.github.io/telegraf-command-arg-parser/

Anyway here's a quick overview of the library:

### `middlewareWithArgs`
This is the main entry point of the library. It provides a simple interface to create a telegraf compatible middleware from a function taking a `ParsedCommand` object as second argument.

```javascript
middlewareWithArgs(argParserBuilder, handler);
```
The first argument can be an already built instance of `ArgParserBuilder` or a function taking an `ArgParserBuilder` as argument. If you choose to receive the instance you will need to configure it in the function.

The second argument is the handler that will receive 3 arguments
- the telegraf.js context;
- an instance of ParsedCommand class;
- the `next()` function.

When configuring the instance of `ArgParserBuilder` you can specify if the handler should always be called or only when valid arguments are found. 

### `ArgParserBuilder`
This builder is the class where you need to declare what your command expect to receive as argument. Currently the following argument types are supported:
- `number()`: a number, there are a few options that can be specified as argument in a hash object:
    - `min`: a lower bound for the accepted range
    - `max`: an upper bound for the accepted range
    - `strict`: whatever to use strict mode for parsing. See [src/middleware-with-args/number-parser-cfg.ts](number-parser-cfg.ts) for a more in-depth explanation.
    - `parser`: You can supply a custom parsing function to support i18n. Never pass `parseInt` here! See [src/middleware-with-args/number-parser-cfg.ts](number-parser-cfg.ts) for a more in-depth explanation.
- `string()`: a string, no validation performed. Stops at first space.
- `oneOf()`: a string from a list of accepted values. 
- `rest()`: what was not consumed by other arguments in a single string argument. 
- `custom()`: What to do custom parsing? Pass your function here. 


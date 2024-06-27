import * as shared from "./utils/shared";
import * as custom from "./utils/custom-tag";
import * as command from "./utils/command-tag";
import * as regular from "./utils/regular-tag";
import * as misc from "./utils/misc";

export const tokenize = (input) => {
    let current = 0;
    const tokens = [];
    const UPPER = /[A-Z]/;

    current = shared.skipSpaces(input, current);

    while (current < input.length) {
        let char = input[current];

        if (char === '<') {
            current = shared.skipSpaces(input, ++current)
            char = input[current];

            if (char === '/') {
                continue;
            }

            let startToken, bodyTokens;

            if (char === '$') {
                [startToken, current] = command.processCommandTagBodyStart(input, ++current);
                [bodyTokens, current] = command.processCommandTagBody(input, current);

                tokens.push(startToken, ...bodyTokens);
                continue;
            }

            const isCustom = char === char.toUpperCase();

            if (isCustom) {
                [startToken, current] = custom.processCustomTagBodyStart(input, current);
                [bodyTokens, current] = custom.processCustomTagBody(input, current);

                tokens.push(startToken, ...bodyTokens);
                continue;
            }
            [startToken, current] = regular.processRegularTagBodyStart(input, current);
            [bodyTokens, current] = regular.processRegularTagBody(input, current);

            tokens.push(startToken, ...bodyTokens);
            continue;
        }

        let token;

        if (char === '/') {
            current = shared.skipSpaces(input, ++current)
            char = input[current];

            if (char === '>') {
                [token, current] = misc.processMonoTagBodyEnd(input, current);
                tokens.push(token);
                continue;
            }

            if (char === '$') {
                [token, current] = command.processCommandTagChildrenEnd(input, ++current);
                tokens.push(token);
                continue
            }

            const isCustom = UPPER.test(char);

            if (isCustom) {
                [token, current] = custom.processCustomTagChildrenEnd(input, current);
                tokens.push(token);
                continue;
            }

            [token, current] = regular.processRegularTagChildrenEnd(input, current);
            tokens.push(token);
            continue;
        }

        if (char === '>') {
            [token, current] = misc.processSplitTagBodyEnd(input, current);

            tokens.push(token);
            continue;
        }

        [token, current] = misc.processTextToken(input, current);
        tokens.push(token);
    }
    return tokens;
}

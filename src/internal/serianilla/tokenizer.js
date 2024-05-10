import {
    processCustomTagBody,
    processCustomTagBodyStart,
    processCustomTagChildrenEnd
} from "./tokenize-utils/custom-tag.js";

export function tokenize(input) {
    let current = 0;
    const tokens = [];
    const UPPER = /[A-Z]/;

    //region Shared
    const skipSpaces = () => {
        const SPACE_REG = /\s/;

        while (SPACE_REG.test(input[current])) {
            current++;
        }
    }

    const readReferenceValue = () => {
        const VALID_WORD = /^[a-z][a-zA-Z0-9]+$/;

        let value = input[++current];

        while (input[++current] !== '}') {
            value += input[current];
        }

        if (!VALID_WORD.test(value)) {
            throw new TypeError(`Invalid reference value: ${value}`)
        }

        current++;
        skipSpaces();

        return value;
    }

    const readReferenceChain = () => {
        const VALID_WORD = /^([a-z][a-zA-Z0-9]+)(\.[a-z][a-zA-Z0-9]+)+$/;

        let value = input[++current];

        while (input[++current] !== '}') {
            value += input[current];
        }

        if (!VALID_WORD.test(value)) {
            throw new TypeError(`Invalid reference chain: ${value}`)
        }

        const arr = value.split('.');
        const context = arr[0];
        const chainMatches = arr.slice(1);

        current++;
        skipSpaces();

        return {context, chain: chainMatches};
    }

    const readStringValue = () => {
        let value = '';
        current++;

        while (input[current] !== '"') {
            value += input[current++];
        }

        current++;
        skipSpaces();

        return value;
    }

    const processSplitTagBodyEnd = () => {
        current++;
        skipSpaces();

        tokens.push({
            type: 'tag-body-end',
            isChildStart: true
        });
    }
    const processMonoTagBodyEnd = () => {
        current++;
        skipSpaces();

        tokens.push({
            type: 'tag-body-end',
            isChildStart: false
        });
    }
    //endregion

    //region Command Tag
    const readCommandParamName = () => {
        const VALID_CHAR = /[^=\s]/;
        const VALID_WORD = /^[a-z][a-zA-Z0-9]+$/;   // lowerCamelCase

        let value = input[current];

        while (VALID_CHAR.test(input[++current])) {
            value += input[current];
        }

        if (!VALID_WORD.test(value)) {
            throw new TypeError(`Invalid params name "${value}"`)
        }

        return value
    }

    const readCommandTagName = () => {
        const VALID_CHAR = /[^/>\s]/;
        const VALID_WORD = /^[a-z][a-zA-Z0-9]+$/;   // lowerCamelCase

        let value = input[current];

        while (VALID_CHAR.test(input[++current])) {
            value += input[current];
        }

        if (!VALID_WORD.test(value)) {
            throw new TypeError(`Invalid command tag name "$${value}"`)
        }

        return value
    }

    const processCommandParamsToken = () => {
        const paramName = readCommandParamName();

        let char = input[current];

        if (char !== '=') {
            throw new TypeError(`Invalid command parameter "${name}" at ${current}: Empty parameters are not allowed`)
        }

        current++;
        skipSpaces();
        char = input[current];

        if (char !== '"' && char !== '{') {
            throw new TypeError(`Unresolved command parameter value at ${current}. '{' or '"' expected, got '${char}'`);
        }

        if (char === '"') {
            const string = readStringValue()

            tokens.push({
                type: 'param',
                name: paramName,
                valueType: 'string',
                value: string
            });
            return;
        }

        const tmpCurrent = current;

        current++;
        skipSpaces();
        char = input[current];

        if (char === '$') {
            const refChainInfo = readReferenceChain();

            tokens.push({
                type: 'param',
                name: paramName,
                valueType: 'ref-chain',
                value: refChainInfo
            });
            return
        }

        current = tmpCurrent;
        const ref = readReferenceValue();

        tokens.push({
            type: 'param',
            name: paramName,
            valueType: 'ref',
            value: ref});
    }

    const processCommandTagBodyStart = () => {
        const tagName = readCommandTagName();

        tokens.push({
            type: 'tag-body-start',
            name: tagName,
            isCommand: true,
            isCustom: false
        });

        skipSpaces();
    }

    const processCommandTagBody = () => {
        const STOP_CHARS = '/>';
        let char = input[current];

        while (!STOP_CHARS.includes(char)) {
            processCommandParamsToken();
            char = input[current];
        }
    }

    const processCommandTagChildrenEnd = () => {
        const tagName = readCommandTagName();

        // skip the upcoming ">"
        current++;
        skipSpaces()

        tokens.push({
            type: 'tag-child-end',
            name: tagName
        });
    }
    //endregion

    //region Regular Tag
    const readBubblingEventName = () => {
        const VALID_CHAR = /[^=\s]/;
        const VALID_WORD = /^[A-Z][a-zA-Z0-9]+$/;   // UpperCamelCase

        let value = input[current];

        while (VALID_CHAR.test(input[++current])) {
            value += input[current];
        }

        if (!VALID_WORD.test(value)) {
            throw new TypeError(`Invalid bubbling event name "on${value}"`)
        }
        return value.toLowerCase();
    }

    const processBubblingEventToken = () => {
        const eventName = readBubblingEventName();
        let char = input[current];

        if (char !== '=') {
            throw new TypeError(`Invalid bubbling event "on${name}": Empty events are not allowed`)
        }

        current++;
        skipSpaces();
        char = input[current];

        if (char !== '{') {
            throw new TypeError(`Unresolved bubbling event value at ${current}. '{' expected, got '${char}'`);
        }

        const tmpCurrent = current;

        current++;
        skipSpaces();
        char = input[current];

        if (char === '$') {
            const refChainInfo = readReferenceChain();

            tokens.push({
                type: 'bubbling-event',
                name: eventName,
                valueType: 'ref-chain',
                value: refChainInfo
            });
            return
        }

        current = tmpCurrent;
        const ref = readReferenceValue();

        tokens.push({
            type: 'bubbling-event',
            name: eventName,
            valueType: 'ref',
            value: ref});
    }

    const readImplicitEventName = () => {
        const VALID_CHAR = /[^=\s]/;
        const VALID_WORD = /^[a-z]+$/;   // lowercase

        let value = input[current];

        while (VALID_CHAR.test(input[++current])) {
            value += input[current];
        }

        if (!VALID_WORD.test(value)) {
            throw new TypeError(`Invalid implicit event name "on${value}"`)
        }
        return value;
    }

    const processImplicitEventToken = () => {
        const eventName = readImplicitEventName();

        let char = input[current];

        if (char !== '=') {
            throw new TypeError(`Invalid implicit event "on${name}": Empty events are not allowed`)
        }

        current++;
        skipSpaces();
        char = input[current];

        if (char !== '{') {
            throw new TypeError(`Unresolved implicit event value at ${current}. '{' expected, got '${char}'`);
        }

        const tmpCurrent = current;

        current++;
        skipSpaces();
        char = input[current];

        if (char === '$') {
            const refChainInfo = readReferenceChain();

            tokens.push({
                type: 'implicit-event',
                name: eventName,
                valueType: 'ref-chain',
                value: refChainInfo
            });
            return
        }

        current = tmpCurrent;
        const ref = readReferenceValue();

        tokens.push({
            type: 'implicit-event',
            name: eventName,
            valueType: 'ref',
            value: ref});
    }

    const readRegularTagName = () => {
        const VALID_CHAR = /[^/>\s]/;
        const VALID_WORD = /^([a-z][a-z0-9]*)(-[a-z0-9]+)*$/;   // kebab-case

        let value = input[current];

        while (VALID_CHAR.test(input[++current])) {
            value += input[current];
        }

        if (!VALID_WORD.test(value)) {
            throw new TypeError(`Invalid regular tag name "${value}"`)
        }

        return value
    }

    const readAttributeName = () => {
        const VALID_CHAR = /[^/>\s]/;
        const VALID_WORD = /^(([a-z][a-z0-9]*)(-[a-z0-9]+)*|[a-z][a-zA-Z0-9]+)$/;   // kebab-case or lowerCamelCase

        let value = input[current];

        while (VALID_CHAR.test(input[++current])) {
            value += input[current];
        }

        if (!VALID_WORD.test(value)) {
            throw new TypeError(`Invalid attribute name "${value}"`)
        }

        return value
    }

    const processAttributeToken = () => {
        const attrName = readAttributeName();

        let char = input[current];

        if (char !== '=') {
            skipSpaces();

            tokens.push({
                type: 'attr',
                name: attrName,
                valueType: 'empty'
            });
            return;
        }

        current++;
        skipSpaces();
        char = input[current];

        if (char !== '"' && char !== '{') {
            throw new TypeError(`Unresolved attribute value at ${current}. '{' or '"' expected, got '${char}'`);
        }

        if (char === '"') {
            const string = readStringValue()

            tokens.push({
                type: 'attr',
                name: attrName,
                valueType: 'string',
                value: string
            });
            return;
        }

        const tmpCurrent = current;

        current++;
        skipSpaces();
        char = input[current];

        if (char === '$') {
            const refChainInfo = readReferenceChain();

            tokens.push({
                type: 'attr',
                name: attrName,
                valueType: 'ref-chain',
                value: refChainInfo
            });
            return
        }

        current = tmpCurrent;
        const ref = readReferenceValue();

        tokens.push({
            type: 'attr',
            name: attrName,
            valueType: 'ref',
            value: ref});
    }

    const processRegularTagBodyStart = () => {
        const tagName = readRegularTagName();

        tokens.push({
            type: 'tag-body-start',
            name: tagName,
            isCommand: false,
            isCustom: false
        });

        skipSpaces();
    }

    const processRegularTagBody = () => {
        const STOP_CHARS = '/>';
        let char = input[current];

        while (!STOP_CHARS.includes(char)) {
            if (char + input[current + 1] === 'on' && input[current + 2] === input[current + 2].toUpperCase()) {
                current += 2;
                processBubblingEventToken();
            } else if (char + input[current + 1] === 'on') {
                current += 2;
                processImplicitEventToken();
            } else {
                processAttributeToken();
            }
            char = input[current];
        }
    }

    const processRegularTagChildrenEnd = () => {
        const tagName = readRegularTagName();

        // skip the upcoming ">"
        current++;
        skipSpaces()

        tokens.push({
            type: 'tag-child-end',
            name: tagName
        });
    }
    //endregion

    const processTextToken = () => {
        const TEXT_CHUNK_REG = /[^<>]/;

        let value = input[current];

        while (TEXT_CHUNK_REG.test(input[++current])) {
            value += input[current];
        }

        tokens.push({type: 'text', value: value.trim()});
    }

    skipSpaces();

    while (current < input.length) {
        let char = input[current];

        if (char === '<') {
            current++;

            skipSpaces();
            char = input[current];

            if (char === '/') {
                continue;
            }

            if (char === '$') {
                current++;

                processCommandTagBodyStart();
                processCommandTagBody();
                continue;
            }

            const isCustom = UPPER.test(char);

            if (isCustom) {
                let startToken, propsTokens;

                [startToken, current] = processCustomTagBodyStart(input, current);
                [propsTokens, current] = processCustomTagBody(input, current);

                tokens.push(startToken, ...propsTokens);
                continue;
            }
            processRegularTagBodyStart();
            processRegularTagBody();
            continue;
        }

        if (char === '/') {
            current++;

            skipSpaces();
            char = input[current];

            if (char === '>') {
                processMonoTagBodyEnd();
                continue;
            }

            if (char === '$') {
                current++;
                processCommandTagChildrenEnd();
                continue
            }

            const isCustom = UPPER.test(char);

            if (isCustom) {
                let token;
                [token, current] = processCustomTagChildrenEnd(input, current);
                tokens.push(token);
                continue;
            }

            processRegularTagChildrenEnd();
            continue;
        }

        if (char === '>') {
            processSplitTagBodyEnd();
            continue;
        }

        processTextToken();
    }
    return tokens;
}
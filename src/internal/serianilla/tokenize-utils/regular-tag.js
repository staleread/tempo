import {readReferenceChain, readReferenceValue, readStringValue, skipSpaces} from "./shared.js";

export const readBubblingEventName = (input, current) => {
    const VALID_CHAR = /[^=\s]/;
    const VALID_WORD = /^[A-Z][a-zA-Z0-9]+$/;   // UpperCamelCase

    let value = input[current];

    while (VALID_CHAR.test(input[++current])) {
        value += input[current];
    }

    if (!VALID_WORD.test(value)) {
        throw new TypeError(`Invalid bubbling event name "on${value}"`)
    }
    return [value.toLowerCase(), current];
}

export const processBubblingEventToken = (input, current) => {
    let eventName;
    [eventName, current] = readBubblingEventName(input, current);
    let char = input[current];

    if (char !== '=') {
        throw new TypeError(`Invalid bubbling event "on${eventName}": Empty events are not allowed`)
    }

    current = skipSpaces(input, ++current);
    char = input[current];

    if (char !== '{') {
        throw new TypeError(`Unresolved bubbling event value at ${current}. '{' expected, got '${char}'`);
    }

    const tmpCurrent = current;

    current = skipSpaces(input, ++current);
    char = input[current];

    if (char === '$') {
        let refChainInfo;
        [refChainInfo, current] = readReferenceChain(input, current);

        const token = {
            type: 'bubbling-event',
            name: eventName,
            valueType: 'ref-chain',
            value: refChainInfo
        };
        return [token, current];
    }

    current = tmpCurrent;
    let ref;
    [ref, current] = readReferenceValue(input, current);

    const token = {
        type: 'bubbling-event',
        name: eventName,
        valueType: 'ref',
        value: ref
    };
    return [token, current];
}

export const readImplicitEventName = (input, current) => {
    const VALID_CHAR = /[^=\s]/;
    const VALID_WORD = /^[a-z]+$/;   // lowercase

    let value = input[current];

    while (VALID_CHAR.test(input[++current])) {
        value += input[current];
    }

    if (!VALID_WORD.test(value)) {
        throw new TypeError(`Invalid implicit event name "on${value}"`)
    }
    return [value, current];
}

export const processImplicitEventToken = (input, current) => {
    let eventName;
    [eventName, current] = readImplicitEventName(input, current);

    let char = input[current];

    if (char !== '=') {
        throw new TypeError(`Invalid implicit event "on${eventName}": Empty events are not allowed`)
    }

    current = skipSpaces(input, ++current);
    char = input[current];

    if (char !== '{') {
        throw new TypeError(`Unresolved implicit event value at ${current}. '{' expected, got '${char}'`);
    }

    const tmpCurrent = current;

    current = skipSpaces(input, ++current);
    char = input[current];

    if (char === '$') {
        let refChainInfo;
        [refChainInfo, current] = readReferenceChain(input, current);

        const token = {
            type: 'implicit-event',
            name: eventName,
            valueType: 'ref-chain',
            value: refChainInfo
        };
        return [token, current];
    }
    current = tmpCurrent;

    let ref;
    [ref, current] = readReferenceValue(input, current);

    const token = {
        type: 'implicit-event',
        name: eventName,
        valueType: 'ref',
        value: ref
    };
    return [token, current];
}

export const readRegularTagName = (input, current) => {
    const VALID_CHAR = /[^/>\s]/;
    const VALID_WORD = /^([a-z][a-z0-9]*)(-[a-z0-9]+)*$/;   // kebab-case

    let value = input[current];

    while (VALID_CHAR.test(input[++current])) {
        value += input[current];
    }

    if (!VALID_WORD.test(value)) {
        throw new TypeError(`Invalid regular tag name "${value}"`)
    }

    return [value, current]
}

export const readAttributeName = (input, current) => {
    const VALID_CHAR = /[^/>\s]/;
    const VALID_WORD = /^(([a-z][a-z0-9]*)(-[a-z0-9]+)*|[a-z][a-zA-Z0-9]+)$/;   // kebab-case or lowerCamelCase

    let value = input[current];

    while (VALID_CHAR.test(input[++current])) {
        value += input[current];
    }

    if (!VALID_WORD.test(value)) {
        throw new TypeError(`Invalid attribute name "${value}"`)
    }

    return [value, current];
}

export const processAttributeToken = (input, current) => {
    let attrName;
    [attrName, current] = readAttributeName(input, current);

    let char = input[current];

    if (char !== '=') {
        current = skipSpaces(input, current);

        const token = {
            type: 'attr',
            name: attrName,
            valueType: 'empty'
        };
        return [token, current];
    }

    current = skipSpaces(input, ++current);
    char = input[current];

    if (char !== '"' && char !== '{') {
        throw new TypeError(`Unresolved attribute value at ${current}. '{' or '"' expected, got '${char}'`);
    }

    if (char === '"') {
        let string;
        [string, current] = readStringValue(input, current)

        const token = {
            type: 'attr',
            name: attrName,
            valueType: 'string',
            value: string
        };
        return [token, current];
    }

    const tmpCurrent = current;

    current = skipSpaces(input, ++current);
    char = input[current];

    if (char === '$') {
        let refChainInfo;
        [refChainInfo, current] = readReferenceChain(input, current);

        const token = {
            type: 'attr',
            name: attrName,
            valueType: 'ref-chain',
            value: refChainInfo
        };
        return [token, current];
    }
    current = tmpCurrent;

    let ref;
    [ref, current] = readReferenceValue(input, current);

    const token = {
        type: 'attr',
        name: attrName,
        valueType: 'ref',
        value: ref
    };
    return [token, current];
}

export const processRegularTagBodyStart = (input, current) => {
    let tagName;
    [tagName, current] = readRegularTagName(input, current);

    const token = {
        type: 'tag-body-start',
        name: tagName,
        isCommand: false,
        isCustom: false
    };

    current = skipSpaces(input, current);
    return [token, current];
}

export const processRegularTagBody = (input, current) => {
    const STOP_CHARS = '/>';
    const tokens = [];

    let char = input[current];

    while (!STOP_CHARS.includes(char)) {
        let token;

        if (char + input[current + 1] === 'on' && input[current + 2] === input[current + 2].toUpperCase()) {
            current += 2;

            [token, current] = processBubblingEventToken(input, current);
            tokens.push(token);
        } else if (char + input[current + 1] === 'on') {
            current += 2;

            [token, current] = processImplicitEventToken(input, current);
            tokens.push(token);
        } else {
            [token, current] = processAttributeToken(input, current);
            tokens.push(token);
        }
        char = input[current];
    }

    return [tokens, current];
}

export const processRegularTagChildrenEnd = (input, current) => {
    let tagName;
    [tagName, current] = readRegularTagName(input, current);

    // skip the upcoming ">"
    current = skipSpaces(input, ++current);

    const token = {
        type: 'tag-child-end',
        name: tagName
    };

    return [token, current];
}
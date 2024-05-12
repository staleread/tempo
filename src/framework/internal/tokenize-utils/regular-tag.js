import {readValue, skipSpaces} from "./shared.js";

export const readEventName = (input, current) => {
    const STOP_CHARS = '= ';
    const VALID_WORD = /^[A-Z][a-zA-Z]+$/;    // UpperCamelCase

    let value = input[current];
    let char = input[++current];

    while (!STOP_CHARS.includes(char)) {
        value += char;
        char = input[++current];
    }

    if (!VALID_WORD.test(value)) {
        throw new TypeError(`Invalid event name "on${value}"`)
    }
    return [value, current];
}

export const processEventToken = (input, current) => {
    let eventName, valueType, value;

    [eventName, current] = readEventName(input, current);
    [valueType, value, current] = readValue(input, current);

    if (valueType === 'empty') {
        throw new TypeError(`Invalid bubbling event "on${eventName}": Empty events are not allowed`)
    }
    const token = {
        type: 'event',
        name: eventName,
        valueType,
        value
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
    const VALID_CHAR = /[^=/>\s]/;
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
    let attrName, valueType, value;

    [attrName, current] = readAttributeName(input, current);
    [valueType, value, current] = readValue(input, current);

    const token = {
        type: 'attr',
        name: attrName,
        valueType,
        value
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

        if (char + input[current + 1] === 'on') {
            current += 2;

            [token, current] = processEventToken(input, current);
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
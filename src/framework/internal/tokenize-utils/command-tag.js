import {readValue, skipSpaces} from "./shared.js";

export const readCommandParamName = (input, current) => {
    const VALID_CHAR = /[^=\s]/;
    const VALID_WORD = /^[a-z][a-zA-Z0-9]+$/;   // lowerCamelCase

    let value = input[current];

    while (VALID_CHAR.test(input[++current])) {
        value += input[current];
    }

    if (!VALID_WORD.test(value)) {
        throw new TypeError(`Invalid params name "${value}"`)
    }

    return [value, current];
}

export const readCommandTagName = (input, current) => {
    const VALID_CHAR = /[^/>\s]/;
    const VALID_WORD = /^[a-z][a-zA-Z0-9]+$/;   // lowerCamelCase

    let value = input[current];

    while (VALID_CHAR.test(input[++current])) {
        value += input[current];
    }

    if (!VALID_WORD.test(value)) {
        throw new TypeError(`Invalid command tag name "$${value}"`)
    }

    return [value, current];
}

export const processCommandParamsToken = (input, current) => {
    let paramName, valueType, value;

    [paramName, current] = readCommandParamName(input, current);
    [valueType, value, current] = readValue(input, current);

    if (valueType === 'empty') {
        throw new TypeError(`Invalid command parameter "${paramName}": Empty parameters are not allowed`)
    }

    const token = {
        type: 'param',
        name: paramName,
        valueType,
        value
    };
    return [token, current];
}

export const processCommandTagBodyStart = (input, current) => {
    let tagName;
    [tagName, current] = readCommandTagName(input, current);

    const token = {
        type: 'tag-body-start',
        name: tagName,
        isCommand: true,
        isCustom: false
    };

    current = skipSpaces(input, current);
    return [token, current];
}

export const processCommandTagBody = (input, current) => {
    const STOP_CHARS = '/>';
    const paramsTokens = [];

    let char = input[current];

    while (!STOP_CHARS.includes(char)) {
        let token;
        [token, current] = processCommandParamsToken(input, current);

        paramsTokens.push(token);
        char = input[current];
    }

    return [paramsTokens, current];
}

export const processCommandTagChildrenEnd = (input, current) => {
    let tagName;
    [tagName, current] = readCommandTagName(input, current);

    // skip the upcoming ">"
    current = skipSpaces(input, ++current)

    const token = {
        type: 'tag-child-end',
        name: tagName
    };
    return [token, current];
}
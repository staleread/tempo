import {LOWER_CAMEL_CASE, readValue, readWord, skipSpaces} from "./shared.js";

const processCommandParamsToken = (input, current) => {
    let paramName, valueType, value;

    [paramName, current] = readWord(input, current, LOWER_CAMEL_CASE);
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
    [tagName, current] = readWord(input, current, LOWER_CAMEL_CASE);

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
    [tagName, current] = readWord(input, current, LOWER_CAMEL_CASE);

    // skip the upcoming ">"
    current = skipSpaces(input, ++current)

    const token = {
        type: 'tag-child-end',
        name: tagName
    };
    return [token, current];
}
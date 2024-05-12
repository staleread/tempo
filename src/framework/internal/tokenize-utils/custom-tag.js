import {readReference, readStringValue, skipSpaces} from "./shared.js";

export const readPropsName = (input, current) => {
    const VALID_CHAR = /[^=\s]/;
    const VALID_WORD = /^[a-z][a-zA-Z0-9]+$/;   // lowerCamelCase

    let value = input[current];

    while (VALID_CHAR.test(input[++current])) {
        value += input[current];
    }

    if (!VALID_WORD.test(value)) {
        throw new TypeError(`Invalid props name "${value}"`)
    }

    return [value, current];
}

export const readCustomTagName = (input, current) => {
    const VALID_CHAR = /[^/>\s]/;
    const VALID_WORD = /^[A-Z][a-zA-Z0-9]+$/;   // UpperCamelCase

    let value = input[current];

    while (VALID_CHAR.test(input[++current])) {
        value += input[current];
    }

    if (!VALID_WORD.test(value)) {
        throw new TypeError(`Invalid regular tag name "${value}"`)
    }

    return [value, current];
}

export const processPropsToken = (input, current) => {
    let propsName;
    [propsName, current] = readPropsName(input, current);

    let char = input[current];

    if (char !== '=') {
        throw new TypeError(`Invalid prop "${propsName}" at ${current}: Empty props are not allowed`)
    }

    current = skipSpaces(input, ++current);
    char = input[current];

    if (char !== '"' && char !== '{') {
        throw new TypeError(`Unresolved props value at ${current}. '{' or '"' expected, got '${char}'`);
    }

    if (char === '"') {
        let string;
        [string, current] = readStringValue(input, current);

        const token = {
            type: 'props',
            name: propsName,
            valueType: 'string',
            value: string
        };
        return [token, current];
    }

    let refType, refValue;
    [refType, refValue, current] = readReference(input, current);

    const token = {
        type: 'props',
        name: propsName,
        valueType: refType,
        value: refValue
    };
    return [token, current];
}

export const processCustomTagBodyStart = (input, current) => {
    let tagName;
    [tagName, current] = readCustomTagName(input, current);

    const token = {
        type: 'tag-body-start',
        name: tagName,
        isCommand: false,
        isCustom: true
    };

    current = skipSpaces(input, current);
    return [token, current];
}

export const processCustomTagBody = (input, current) => {
    const STOP_CHARS = '/>';
    const propsList = [];

    let char = input[current];

    while (!STOP_CHARS.includes(char)) {
        let props;
        [props, current] = processPropsToken(input, current);

        propsList.push(props);
        char = input[current];
    }

    return [propsList, current];
}

export const processCustomTagChildrenEnd = (input, current) => {
    let tagName;
    [tagName, current] = readCustomTagName(input, current);

    // skip the upcoming ">"
    current++;
    current = skipSpaces(input, current)

    const token = {
        type: 'tag-child-end',
        name: tagName
    };

    return [token, current];
}
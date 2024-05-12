import {
    KEBAB_CASE,
    KEBAB_OR_LOWER_CAMEL_CASE,
    UPPER_CAMEL_CASE,
    readValue,
    readWord,
    skipSpaces
} from "./shared.js";

export const processEventToken = (input, current) => {
    let eventName, valueType, value;

    [eventName, current] = readWord(input, current, UPPER_CAMEL_CASE);
    [valueType, value, current] = readValue(input, current);

    if (valueType === 'empty') {
        throw new TypeError(`Invalid event "on${eventName}": Empty events are not allowed`)
    }
    if (valueType === 'string') {
        throw new TypeError(`Event "on${eventName}" has invalid event type: a reference value or chain expected`)
    }

    const token = {
        type: 'event',
        name: eventName,
        valueType,
        value
    };
    return [token, current];
}

export const processAttributeToken = (input, current) => {
    let attrName, valueType, value;

    [attrName, current] = readWord(input, current, KEBAB_OR_LOWER_CAMEL_CASE);
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
    [tagName, current] = readWord(input, current, KEBAB_CASE);

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
    [tagName, current] = readWord(input, current, KEBAB_CASE);

    // skip the upcoming ">"
    current = skipSpaces(input, ++current);

    const token = {
        type: 'tag-child-end',
        name: tagName
    };

    return [token, current];
}
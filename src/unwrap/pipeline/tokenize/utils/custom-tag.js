import {
    LOWER_CAMEL_CASE,
    UPPER_CAMEL_CASE,
    readValue,
    readWord,
    skipSpaces
} from "./shared";

const processPropsToken = (input, current) => {
    let propsName, valueType, value;

    [propsName, current] = readWord(input, current, LOWER_CAMEL_CASE);
    [valueType, value, current] = readValue(input, current);

    if (valueType === 'empty') {
        throw new TypeError(`Invalid prop "${propsName}" at ${current}: Empty props are not allowed`)
    }

    const token = {
        type: 'props',
        name: propsName,
        valueType,
        value
    };
    return [token, current];
}

export const processCustomTagBodyStart = (input, current) => {
    let tagName;
    [tagName, current] = readWord(input, current, UPPER_CAMEL_CASE);

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
    [tagName, current] = readWord(input, current, UPPER_CAMEL_CASE);

    // skip the upcoming ">"
    current++;
    current = skipSpaces(input, current)

    const token = {
        type: 'tag-child-end',
        name: tagName
    };

    return [token, current];
}

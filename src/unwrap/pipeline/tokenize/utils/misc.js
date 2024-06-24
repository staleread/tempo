import {skipSpaces, readStringValueNoRepeatedSpaces} from "./shared";

export const processSplitTagBodyEnd = (input, current) => {
    current++;
    current = skipSpaces(input, current);

    const token = {
        type: 'tag-body-end',
        isChildStart: true
    };

    return [token, current];
}

export const processMonoTagBodyEnd = (input, current) => {
    current++;
    current = skipSpaces(input, current);

    const token = {
        type: 'tag-body-end',
        isChildStart: false
    };

    return [token, current];
}

export const processTextToken = (input, current) => {
    let string, refs;
    [string, refs, current] = readStringValueNoRepeatedSpaces(input, current, '<');

    const token = {
        type: 'text',
        value: {
            string: string,
            refs
        }
    };
    return [token, current];
}

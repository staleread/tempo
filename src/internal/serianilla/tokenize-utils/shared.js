export const skipSpaces = (input, current) => {
    const SPACE_REG = /\s/;

    while (SPACE_REG.test(input[current])) {
        current++;
    }
    return current
}

export const readReferenceValue = (input, current) => {
    const VALID_WORD = /^[a-z][a-zA-Z0-9]+$/;

    let value = input[++current];

    while (input[++current] !== '}') {
        value += input[current];
    }

    if (!VALID_WORD.test(value)) {
        throw new TypeError(`Invalid reference value: ${value}`)
    }

    current = skipSpaces(input, ++current);
    return [value, current];
}

export const readReferenceChain = (input, current) => {
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

    current = skipSpaces(input, ++current);
    return [context, chainMatches, current];
}

export const readStringValue = (input, current) => {
    let value = '';
    current++;

    while (input[current] !== '"') {
        value += input[current++];
    }

    current = skipSpaces(input, ++current);
    return [value, current];
}

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
    const TEXT_CHUNK_REG = /[^<>]/;

    let value = input[current];

    while (TEXT_CHUNK_REG.test(input[++current])) {
        value += input[current];
    }

    const token = {
        type: 'text',
        value: value.trim()
    };
    return [token, current];
}
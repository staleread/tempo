export const UPPER_CAMEL_CASE = /^[A-Z][a-zA-Z0-9]*$/;
export const LOWER_CAMEL_CASE = /^[a-z][a-zA-Z0-9]*$/;
export const KEBAB_CASE = /^([a-z][a-z0-9]*)(-[a-z0-9]+)*$/;
export const KEBAB_OR_LOWER_CAMEL_CASE = /^(([a-z][a-z0-9]*)(-[a-z0-9]+)*|[a-z][a-zA-Z0-9]+)$/;

export const skipSpaces = (input, current) => {
    const SPACE_REG = /\s/;

    while (SPACE_REG.test(input[current])) {
        current++;
    }
    return current
}

export const readWord = (input, current, validWordReg) => {
    const VALID_CHAR = /[^</>{=}\s]/;
    const startIndex = current;

    let value = '';
    let char = input[current];

    while (VALID_CHAR.test(char)) {
        value += char;
        char = input[++current];
    }

    if (!validWordReg.test(value)) {
        throw new TypeError(`Word "${value}" starting at ${startIndex} must follow a regex ${validWordReg}`)
    }

    return [value, current]
}

const readReferenceValue = (input, current) => {
    const VALID_WORD = /^([a-z][a-zA-Z0-9]+)(\.[a-z][a-zA-Z0-9]+)*$/;

    let value;
    [value, current] = readWord(input, current, VALID_WORD);

    if (input[current] !== '}') {
        throw new TypeError(`Invalid reference value at ${current}. "}" expected at the end, got ${input[current]}`)
    }

    const arr = value.split('.');

    if (arr.length === 1) {
        current = skipSpaces(input, ++current);
        return ['ref', value, current];
    }

    const context = arr[0];
    const chain = arr.slice(1);

    current = skipSpaces(input, ++current);
    return ['ref-chain', {context, chain}, current];
}

const readStringValue = (input, current) => {
    let value = '';

    while (input[current] !== '"') {
        value += input[current++];
    }

    current = skipSpaces(input, ++current);
    return [value, current];
}

export const readValue = (input, current) => {
    let char = input[current];

    if (char !== '=') {
        current = skipSpaces(input, current);
        return ['empty', null, current];
    }

    current = skipSpaces(input, ++current);
    char = input[current];

    if (char !== '"' && char !== '{') {
        throw new TypeError(`Unresolved value at ${current}. '{' or '"' expected, got '${char}'`);
    }

    if (char === '"') {
        current++;

        let string;
        [string, current] = readStringValue(input, current)
        return ['string', string, current];
    }
    current = skipSpaces(input, ++current);
    return readReferenceValue(input, current);
}
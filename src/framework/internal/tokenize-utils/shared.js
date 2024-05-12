export const UPPER_CAMEL_CASE = /^[A-Z][a-zA-Z0-9]+$/;
export const LOWER_CAMEL_CASE = /^[a-z][a-zA-Z0-9]+$/;
export const KEBAB_CASE = /^([a-z][a-z0-9]*)(-[a-z0-9]+)*$/;
export const KEBAB_OR_LOWER_CAMEL_CASE = /^(([a-z][a-z0-9]*)(-[a-z0-9]+)*|[a-z][a-zA-Z0-9]+)$/;

export const skipSpaces = (input, current) => {
    const SPACE_REG = /\s/;

    while (SPACE_REG.test(input[current])) {
        current++;
    }
    return current
}

const readReferenceValue = (input, current) => {
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

const readReferenceChain = (input, current) => {
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

const readStringValue = (input, current) => {
    let value = '';
    current++;

    while (input[current] !== '"') {
        value += input[current++];
    }

    current = skipSpaces(input, ++current);
    return [value, current];
}

export const readWord = (input, current, validWordReg) => {
    const VALID_CHAR = /[^</>=\s]/;
    let value = '';
    let char = input[current];

    while (VALID_CHAR.test(char)) {
        value += char;
        char = input[++current];
    }

    if (!validWordReg.test(value)) {
        throw new TypeError(`Invalid word "${value}". Should follow a regex ${validWordReg}`)
    }

    return [value, current]
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
        let string;
        [string, current] = readStringValue(input, current)
        return ['string', string, current];
    }

    const tmpCurrent = current;

    current = skipSpaces(input, ++current);
    char = input[current];

    if (char === '$') {
        let refChainInfo;
        [refChainInfo, current] = readReferenceChain(input, current);
        return ['ref-chain', refChainInfo, current];
    }

    current = tmpCurrent;
    let ref;
    [ref, current] = readReferenceValue(input, current);
    return ['ref', ref, current];
}
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

    while (VALID_CHAR.test(char) && current < input.length) {
        value += char;
        char = input[++current];
    }

    if (!validWordReg.test(value)) {
        throw new TypeError(`Word "${value}" starting at ${startIndex} must follow a regex ${validWordReg}`)
    }

    return [value, current]
}

export const readReferenceValueSkipAfter = (input, current) => {
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

export const readReferenceValueNoSkip = (input, current) => {
    const VALID_WORD = /^([a-z][a-zA-Z0-9]+)(\.[a-z][a-zA-Z0-9]+)*$/;

    let value;
    [value, current] = readWord(input, current, VALID_WORD);

    if (input[current] !== '}') {
        throw new TypeError(`Invalid reference value at ${current}. "}" expected at the end, got ${input[current]}`)
    }

    const arr = value.split('.');

    if (arr.length === 1) {
        return ['ref', value, current];
    }

    const context = arr[0];
    const chain = arr.slice(1);
    return ['ref-chain', {context, chain}, current];
}

export const readStringValueNoRepeatedSpaces = (input, current, stopChars) => {
    const tmpStart = current;
    const refs = [];

    let string = '';
    let char = input[current];
    let charsSkipped = 0;
    let wasSpace = false;

    while (!stopChars.includes(char) && current < input.length) {
        if (wasSpace && /\s/.test(char)) {
            charsSkipped++;
            char = input[++current];
            continue;
        }
        if (/\s/.test(char)) {
            string += ' ';
            char = input[++current];
            wasSpace = true;
            continue;
        }
        wasSpace = false;

        if (char !== '{') {
            string += char;
            char = input[++current];
            continue;
        }

        const refPos = current - tmpStart - charsSkipped;

        const tmpCurrent = current;
        char = input[++current];
        charsSkipped++;

        let refType, ref;
        [refType, ref, current] = readReferenceValueNoSkip(input, current);
        charsSkipped += current - tmpCurrent

        refs.push({pos: refPos, refType, ref})
        char = input[++current];
    }

    current = skipSpaces(input, ++current);
    return [string, refs, current];
}

const readStringValueAllowRepeatedSpaces = (input, current, stopChars) => {
    const tmpStart = current;
    const refs = [];

    let string = '';
    let char = input[current];
    let charsSkipped = 0;

    while (!stopChars.includes(char) && current < input.length) {
        if (char !== ' ' && /\s/.test(char)) {
            char = input[++current];
            charsSkipped++;
            continue;
        }

        if (char !== '{') {
            string += char;
            char = input[++current];
            continue;
        }
        const refPos = current - tmpStart - charsSkipped;

        const tmpCurrent = current;
        char = input[++current];
        charsSkipped++;

        let refType, ref;
        [refType, ref, current] = readReferenceValueNoSkip(input, current);
        charsSkipped += current - tmpCurrent

        refs.push({pos: refPos, refType, ref})
        char = input[++current];
    }

    current = skipSpaces(input, ++current);
    return [string, refs, current];
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

        let string, refs;
        [string, refs, current] = readStringValueAllowRepeatedSpaces(input, current, '"')
        return ['string', {string, refs}, current];
    }
    current = skipSpaces(input, ++current);
    return readReferenceValueSkipAfter(input, current);
}
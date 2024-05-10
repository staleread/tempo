export function tokenize(input) {
    let current = 0;
    const tokens = [];

    const skipSpaces = () => {
        const SPACE_REG = /\s/;

        while (SPACE_REG.test(input[current])) {
            current++;
        }
    }

    const readCustomTagName = () => {
        const VALID_CHAR = /[^/>\s]/;
        const VALID_WORD = /^[A-Z][a-zA-Z0-9]+$/;   // UpperCamelCase

        let value = input[current];

        while (VALID_CHAR.test(input[++current])) {
            value += input[current];
        }

        if (!VALID_WORD.test(value)) {
            throw new TypeError(`Invalid regular tag name "${value}"`)
        }

        return value
    }

    const readRegularTagName = () => {
        const VALID_CHAR = /[^/>\s]/;
        const VALID_WORD = /^([a-z][a-z0-9]*)(-[a-z0-9]+)*$/;   // kebab-case

        let value = input[current];

        while (VALID_CHAR.test(input[++current])) {
            value += input[current];
        }

        if (!VALID_WORD.test(value)) {
            throw new TypeError(`Invalid regular tag name "${value}"`)
        }

        return value
    }

    const readAttributeName = () => {
        const VALID_CHAR = /[^/>\s]/;
        const VALID_WORD = /^(([a-z][a-z0-9]*)(-[a-z0-9]+)*|[a-z][a-zA-Z0-9]+)$/;   // kebab-case or lowerCamelCase

        let value = input[current];

        while (VALID_CHAR.test(input[++current])) {
            value += input[current];
        }

        if (!VALID_WORD.test(value)) {
            throw new TypeError(`Invalid attribute name "${value}"`)
        }

        return value
    }

    const readPropsName = () => {
        const VALID_CHAR = /[^=\s]/;
        const VALID_WORD = /^[a-z][a-zA-Z0-9]+$/;   // lowerCamelCase

        let value = input[current];

        while (VALID_CHAR.test(input[++current])) {
            value += input[current];
        }

        if (!VALID_WORD.test(value)) {
            throw new TypeError(`Invalid props name "${value}"`)
        }

        return value
    }

    const readEventName = () => {
        const VALID_CHAR = /[^=\s]/;
        const VALID_WORD = /^[a-z]+$/;   // lowercase

        let value = input[current];

        while (VALID_CHAR.test(input[++current])) {
            value += input[current];
        }

        if (!VALID_WORD.test(value)) {
            throw new TypeError(`Invalid event name "${value}"`)
        }
        return value;
    }

    const readReferenceValue = () => {
        const VALID_WORD = /^[a-z][a-zA-Z0-9]+$/;

        let value = input[++current];

        while (input[++current] !== '}') {
            value += input[current];
        }

        if (!VALID_WORD.test(value)) {
            throw new TypeError(`Invalid reference value: ${value}`)
        }

        current++;
        skipSpaces();

        return value;
    }

    const readReferenceChain = () => {
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

        current++;
        skipSpaces();

        return {context, chain: chainMatches};
    }

    const readStringValue = () => {
        let value = '';
        current++;

        while (input[current] !== '"') {
            value += input[current++];
        }

        current++;
        skipSpaces();

        return value;
    }

    const processCommandToken = () => {
        const cmdName = readPropsName();

        if (input[current] !== '=') {
            throw new TypeError(`Invalid command "$${cmdName}" at ${current}: Commands must contain a reference value`)
        }

        current++;
        skipSpaces();

        const ref = readReferenceValue();

        tokens.push({
            type: 'cmd',
            name: cmdName,
            paramsRef: ref
        });
    }

    const processEventToken = () => {
        const eventName = readEventName();

        let char = input[current];

        if (char !== '=') {
            throw new TypeError(`Invalid event "${name}": Empty events are not allowed`)
        }

        current++;
        skipSpaces();
        char = input[current];

        if (char !== '{') {
            throw new TypeError(`Unresolved event value at ${current}. '{' expected, got '${char}'`);
        }

        const tmpCurrent = current;

        current++;
        skipSpaces();
        char = input[current];

        if (char === '$') {
            const refChainInfo = readReferenceChain();

            tokens.push({
                type: 'event',
                name: eventName,
                refType: 'ref-chain',
                ref: refChainInfo
            });
            return
        }

        current = tmpCurrent;
        const ref = readReferenceValue();

        tokens.push({
            type: 'event',
            name: eventName,
            refType: 'ref',
            ref: ref});
    }

    const processPropsToken = () => {
        const propsName = readPropsName();

        let char = input[current];

        if (char !== '=') {
            throw new TypeError(`Invalid prop "${name}" at ${current}: Empty props are not allowed`)
        }

        current++;
        skipSpaces();
        char = input[current];

        if (char !== '"' && char !== '{') {
            throw new TypeError(`Unresolved props value at ${current}. '{' or '"' expected, got '${char}'`);
        }

        if (char === '"') {
            const string = readStringValue()

            tokens.push({
                type: 'props',
                name: propsName,
                valueType: 'string',
                value: string
            });
            return;
        }

        const tmpCurrent = current;

        current++;
        skipSpaces();
        char = input[current];

        if (char === '$') {
            const refChainInfo = readReferenceChain();

            tokens.push({
                type: 'props',
                name: propsName,
                valueType: 'ref-chain',
                value: refChainInfo
            });
            return
        }

        current = tmpCurrent;
        const ref = readReferenceValue();

        tokens.push({
            type: 'props',
            name: propsName,
            valueType: 'ref',
            value: ref});
    }

    const processAttributeToken = () => {
        const attrName = readAttributeName();

        let char = input[current];

        if (char !== '=') {
            skipSpaces();

            tokens.push({
                type: 'attr',
                name: attrName,
                valueType: 'empty'
            });
            return;
        }

        current++;
        skipSpaces();
        char = input[current];

        if (char !== '"' && char !== '{') {
            throw new TypeError(`Unresolved attribute value at ${current}. '{' or '"' expected, got '${char}'`);
        }

        if (char === '"') {
            const string = readStringValue()

            tokens.push({
                type: 'attr',
                name: attrName,
                valueType: 'string',
                value: string
            });
            return;
        }

        const tmpCurrent = current;

        current++;
        skipSpaces();
        char = input[current];

        if (char === '$') {
            const refChainInfo = readReferenceChain();

            tokens.push({
                type: 'attr',
                name: attrName,
                valueType: 'ref-chain',
                value: refChainInfo
            });
            return
        }

        current = tmpCurrent;
        const ref = readReferenceValue();

        tokens.push({
            type: 'attr',
            name: attrName,
            valueType: 'ref',
            value: ref});
    }

    const processTextToken = () => {
        const TEXT_CHUNK_REG = /[^<>]/;

        let value = input[current];

        while (TEXT_CHUNK_REG.test(input[++current])) {
            value += input[current];
        }

        tokens.push({type: 'text', value: value.trim()});
    }

    const processCustomTagBodyStart = () => {
        const tagName = readCustomTagName();

        tokens.push({
            type: 'tag-body-start',
            name: tagName,
            isCustom: true
        });

        skipSpaces();
    }

    const processRegularTagBodyStart = () => {
        const tagName = readRegularTagName();

        tokens.push({
            type: 'tag-body-start',
            name: tagName,
            isCustom: false
        });

        skipSpaces();
    }

    const processCustomTagBody = () => {
        const STOP_CHARS = '/>';
        let char = input[current];

        while (!STOP_CHARS.includes(char)) {
            processPropsToken();
            char = input[current];
        }
    }

    const processRegularTagBody = () => {
        const STOP_CHARS = '/>';
        let char = input[current];

        while (!STOP_CHARS.includes(char)) {
            if (char === '$') {
                current++;
                processCommandToken();
            } else if (char + input[current + 1] === 'on') {
                current += 2;
                processEventToken();
            } else {
                processAttributeToken();
            }
            char = input[current];
        }
    }

    const processMonoTagBodyEnd = () => {
        current++;
        skipSpaces();

        tokens.push({
            type: 'tag-body-end',
            isChildStart: false
        });
    }

    const processSplitTagBodyEnd = () => {
        current++;
        skipSpaces();

        tokens.push({
            type: 'tag-body-end',
            isChildStart: true
        });
    }

    const processCustomTagChildrenEnd = () => {
        const tagName = readCustomTagName();

        // skip the upcoming ">"
        current++;
        skipSpaces()

        tokens.push({
            type: 'tag-child-end',
            name: tagName
        });
    }

    const processRegularTagChildrenEnd = () => {
        const tagName = readRegularTagName();

        // skip the upcoming ">"
        current++;
        skipSpaces()

        tokens.push({
            type: 'tag-child-end',
            name: tagName
        });
    }

    skipSpaces();

    const UPPER = /[A-Z]/;

    while (current < input.length) {
        let char = input[current];

        if (char === '<') {
            current++;

            skipSpaces();
            char = input[current];

            if (char === '/') {
                continue;
            }

            const isCustom = UPPER.test(char);

            if (isCustom) {
                processCustomTagBodyStart();
                processCustomTagBody();
                continue;
            }
            processRegularTagBodyStart();
            processRegularTagBody();
            continue;
        }

        if (char === '/') {
            current++;

            skipSpaces();
            char = input[current];

            if (char === '>') {
                processMonoTagBodyEnd();
            }

            const isCustom = UPPER.test(char);

            isCustom
                ? processCustomTagChildrenEnd()
                : processRegularTagChildrenEnd();
            continue;
        }

        if (char === '>') {
            processSplitTagBodyEnd();
            continue;
        }

        processTextToken();
    }
    return tokens;
}
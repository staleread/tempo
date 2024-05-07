export function tokenize(input) {
    let current = 0;
    const tokens = [];

    const TEXT_CHUNK_REG = /[^<>{}]/
    const KEBAB_CASE_SYMBOLS = /[a-z-]/
    const KEBAB_CASE = /^([a-z][a-z0-9]*)(-[a-z0-9]+)*$/;
    const LOWER_CAMEL_CASE = /^[a-z][a-zA-Z0-9]+$/

    function getLastTagWithChildrenStarted() {
        let tagStack = [];
        const tags = tokens.filter(t => t.type === 'tag');

        for (const tag of tags) {
            if (tag.children === 'start') {
                tagStack.push(tag.name);
            } else if (tag.children === 'end') {
                tagStack.pop();
            }
        }

        return tagStack.at(-1);
    }


    function getLastTagWithBodyStarted() {
        let tagStack = [];
        const tags = tokens.filter(t => t.type === 'tag');

        for (const tag of tags) {
            if (tag.body === 'start') {
                tagStack.push(tag.name);
            } else if (tag.body === 'end') {
                tagStack.pop();
            }
        }

        return tagStack.at(-1);
    }

    function skipSpaces() {
        const SPACE_REG = /\s/;

        while (SPACE_REG.test(input[current])) {
            current++;
        }
    }

    function readKebabWord() {
        if (!KEBAB_CASE_SYMBOLS.test(input[current])) {
            throw new TypeError(`Invalid name token chunk found at ${current}: ${input[current]}`)
        }

        let value = input[current];

        while (KEBAB_CASE_SYMBOLS.test(input[++current]) && current < input.length) {
            value += input[current];
        }

        if (!KEBAB_CASE.test(value)) {
            throw new TypeError(`Invalid name token "${value}"`)
        }

        return value
    }

    function readSerialValue() {
        if (input[current] !== '{') {
            throw new TypeError(`Invalid serial value. "{" expected at ${current}, not "${input[current]}"`)
        }

        let value = input[++current];

        while (input[++current] !== '}') {
            value += input[current];
        }

        if (!LOWER_CAMEL_CASE.test(value)) {
            throw new TypeError(`Invalid serial value chunk found at ${current}: ${input[current]}`)
        }

        current++;
        skipSpaces();

        return value;
    }

    function readStringValue() {
        if (input[current] !== '"') {
            throw new TypeError(`Invalid string value. '"' expected at ${current}, not '${input[current]}'`)
        }

        let value = input[++current];

        while (input[++current] !== '"') {
            value += input[current];
        }

        if (!LOWER_CAMEL_CASE.test(value)) {
            throw new TypeError(`Invalid string value passed: ${value}`)
        }

        current++;
        skipSpaces();

        return value;
    }

    function readAttrToken() {
        const name = readKebabWord();

        if (input[current] !== '=') {
            return {name, value: null};
        }

        current++;
        skipSpaces();

        if (input[current] === '{') {
            return {valueType: 'serial', value: readSerialValue()};
        } else if (input[current] === '"') {
            return {valueType: 'string', value: readStringValue()};
        } else {
            throw new TypeError(`Unresolved attribute value at ${current}. '{' or '"' expected, got ''${input[current]}`);
        }
    }

    function readTextToken() {
        if (!TEXT_CHUNK_REG.test(input[current])) {
            throw new TypeError(`Invalid text token chunk found at ${current}: ${input[current]}`)
        }

        let value = input[current];

        while (TEXT_CHUNK_REG.test(input[++current]) && current < input.length) {
            value += input[current];
        }
        return value
    }

    function readOpenedTag() {
        if (input[current] !== '<') {
            throw new TypeError(`Invalid opened tag. "<" expected at ${current}, not "${input[current]}"`);
        }

        current++;
        skipSpaces();

        if (input[current] === '/') {
            current++;
            skipSpaces();

            const tagName = readKebabWord();

            if (input[current] !== '>') {
                throw new TypeError(`Invalid end tag. ">" expected at ${current}, not "${input[current]}"`);
            }

            current++;
            skipSpaces();

            if (!getLastTagWithChildrenStarted()) {
                throw new TypeError(`Trying to closed not opened tag: ${tagName}`);
            }

            return {name: tagName, isStart: false};
        }

        const tagName = readKebabWord();
        skipSpaces();

        return {name: tagName, isStart: true};
    }

    function readChildFreeTagBodyEnd() {
        if (input[current] !== '/') {
            throw new TypeError(`Invalid closing end tag. "/" expected at ${current}, not "${input[current]}"`);
        }

        current++;
        skipSpaces();

        if (input[current] !== '>') {
            throw new TypeError(`Invalid closing end tag. ">" expected at ${current}, not "${input[current]}"`);
        }

        current++;
        skipSpaces();

        return getLastTagWithBodyStarted();
    }

    skipSpaces();

    while (current < input.length) {
        let char = input[current];

        if (char === '<') {
            const {name, isStart} = readOpenedTag();
            tokens.push({
                type: 'tag',
                name: name,
                body: isStart ? 'start' : null,
                children: isStart ? null : 'end',
            });

            continue;
        }

        if (char === '/') {
            const name = readChildFreeTagBodyEnd();
            tokens.push({
                type: 'tag',
                name: name,
                body: 'end',
                children: null,
            });

            continue;
        }

        if (char === '>') {
            current++;
            skipSpaces();

            tokens.push({
                type: 'tag',
                name: getLastTagWithBodyStarted(),
                body: 'end',
                children: 'start',
            });

            continue;
        }

        // if (char === '{') {
        //     console.log('Found {');

        //     tokens.push({
        //         type: 'literal-paren',
        //         value: '{'
        //     });

        //     current++;
        //     continue;
        // }

        // if (char === '}') {
        //     console.log('Found }');

        //     tokens.push({
        //         type: 'literal-paren',
        //         value: '}'
        //     });

        //     current++;
        //     continue;
        // }

        const lastTokenBodyState = tokens.at(-1)?.body;

        if ((tokens.length === 0 || lastTokenBodyState !== 'start')
            && TEXT_CHUNK_REG.test(char)) {

            const text = readTextToken();
            tokens.push({type: 'text', value: text});

            continue;
        }

        if (lastTokenBodyState === 'start' && KEBAB_CASE_SYMBOLS.test(char)) {
            const {valueType, value} = readAttrToken();
            tokens.push({type: 'attr', valueType, value});

            continue;
        }

        throw new TypeError(`Not expected token found at ${current}: ${input[current]}`)
    }
    return tokens;
}
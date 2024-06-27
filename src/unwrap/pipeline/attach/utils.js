export const unwrapStringValue = (stringValue, refs, attachMap) => {
    let lastPos = 0;
    let resultString = '';

    refs.forEach(r => {
        const refInfo = {
            valueType: r.refType,
            value: r.ref
        }
        const chunk = retrieveValue(refInfo, attachMap);

        if (chunk === undefined || chunk === null) {
            return;
        }

        resultString += stringValue.slice(lastPos, r.pos);
        resultString += chunk.toString();
        lastPos = r.pos;
    })

    if (lastPos < stringValue.length) {
        resultString += stringValue.slice(lastPos);
    }
    return resultString.trim();
}

export const retrieveValue = ({valueType, value}, attachMap) => {
    if (valueType === 'empty') {
        return '';
    }
    if (valueType === 'string') {
        return unwrapStringValue(value.string, value.refs, attachMap);
    }
    if (valueType === 'ref') {
        const result = attachMap.get(value);

        if (result === undefined) {
            throw new TypeError(`Please attach a reference value of "${value}"`)
        }
        return result;
    }
    if (valueType !== 'ref-chain') {
        throw new TypeError(`Unresolved value type: ${valueType}`);
    }

    const chainInfo = value;
    let result = attachMap.get(chainInfo.context);

    if (result === undefined) {
        throw new TypeError(`Please attach a reference value of "${value}"`)
    }

    for (const chainMember of chainInfo.chain) {
        result = result[chainMember];
    }
    return result;
}

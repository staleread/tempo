export const getSetDiff = (setA, setB) => {
    const result = new Set(setA);

    setB.forEach(elem => {
        result.delete(elem);
    })
    return result;
}


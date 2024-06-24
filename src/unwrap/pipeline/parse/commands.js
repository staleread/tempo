export const acceptedCommands = {
    map: {
        paramsCount: 2,
        expectedParams: {
            context: {
                expectedValueTypes: ['string']
            },
            items: {
                expectedValueTypes: ['ref', 'ref-chain']
            }
        }
    },
    if: {
        paramsCount: 1,
        expectedParams: {
            true: {
                expectedValueTypes: ['ref', 'ref-chain']
            },
            false: {
                expectedValueTypes: ['ref', 'ref-chain']
            },
        }
    }
}

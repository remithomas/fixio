import { fixutil, keyvals } from '../src/fix'
import { sortTags } from '../src/fixutils';

describe('Data mapping tests', () => {
    let sut = fixutil // SUT stands for "System Under Test"

    beforeAll(async () => {
        sut.setSOHCHAR("|")
    });

    test('when convert to FIX using tags order', () => {
        const msg = {
            '35': 'J',
            '1': 'account',
            '460': '4',
            '70': 'AllocID',
        }
        const str = sut.convertToFIX(msg, '4.4', '', 'senderCompId','targetCompId', 1, {
            tagsOrder: [460, 1, 70]
        },)
        expect(str).toEqual('8=4.4|9=73|35=J|49=senderCompId|56=targetCompId|34=1|52=|460=4|1=account|70=AllocID|10=127|')
    })

    test('when request is anonymous object - convert to FIX tags', async () => {
        // Setup
        let expectedMsgType = "J"
        let expectedSymbol = "WFH/WFH"
        let expectedOnBehalfOfSubID = "me@example.com"
        let reqRecord = {
            MsgType: expectedMsgType,
            Symbol: expectedSymbol,
            OnBehalfOfSubID: expectedOnBehalfOfSubID
        }

        // SUT call
        let fixRequestStr = sut.convertMapToFIX(sut.convertFieldsToFixTags(reqRecord))
        let fixRequestParsed = sut.convertToJSON(fixRequestStr)

        // Assertions
        expect(fixRequestStr).toContain(`|55=${expectedSymbol}|`)
        expect(fixRequestStr).toContain(`|116=${expectedOnBehalfOfSubID}|`)
        expect(fixRequestParsed).not.toBe(null)
        expect(fixRequestParsed.Symbol).toBe(expectedSymbol)
        expect(fixRequestParsed.OnBehalfOfSubID).toBe(expectedOnBehalfOfSubID)
        expect(fixRequestStr).toContain(`|35=${expectedMsgType}|`)

        const expected = `|35=${expectedMsgType}|`
        expect(fixRequestStr.replace(expected, '|')).not.toContain(expected)
    });

    test('when request is POJO - convert to FIX tags', async () => {
        // Setup
        let expectedSymbol = "WFH/WFH"
        let request: DummyInterface = {
            Symbol: expectedSymbol
        }

        // SUT call
        let fixRequestStr = sut.convertMapToFIX(sut.convertFieldsToFixTags(request))
        let fixRequestParsed = sut.convertToJSON(fixRequestStr)

        // Assertions
        expect(fixRequestStr).toContain(`|55=${expectedSymbol}|`)
        expect(fixRequestParsed).not.toBe(null)
        expect(fixRequestParsed.Symbol).toBe(expectedSymbol)
    });

    test('when field is unknown by FIX - convert as is', async () => {
        // Setup
        let unknownFieldValue = "value"
        let expectedSymbol = "WFH/WFH"
        let reqRecord = {
            Symbol: expectedSymbol,
            AlienField: unknownFieldValue
        }

        // SUT call
        let fixRequestStr = sut.convertMapToFIX(sut.convertFieldsToFixTags(reqRecord))

        // Assertions
        expect(fixRequestStr).toContain(`|55=${expectedSymbol}|`)
        expect(fixRequestStr).toContain(`|AlienField=${unknownFieldValue}|`)
    });
})

describe('sortTags', () => {
    describe.each([
        { msg: {}, tagsOrder: undefined },
        { msg: {}, tagsOrder: ['1'] },
    ])('empty msg', ({msg, tagsOrder}) => {
        test('should NOT sort msg', () => {
            expect(sortTags(msg, tagsOrder)).toEqual([])
        })
    })
    
    describe.each([
        {   
            name: 'not tags order',
            msg: {
                [keyvals.MsgType]: 'J',
                [keyvals.Account]: 'account',
            }, 
            tagsOrder: [], 
            expected: [
                ['1', 'account'],
                ['35', 'J'],
            ] 
        },
        { 
            name: 'custom tags order',
            msg: {
                [keyvals.MsgType]: 'J',
                [keyvals.Account]: 'account',
            }, 
            tagsOrder: ['35', '1'], 
            expected: [
                ['35', 'J'],
                ['1', 'account'],
            ] 
        },
        { 
            name: 'bigger tags order',
            msg: {
                [keyvals.MsgType]: 'J',
                [keyvals.Account]: 'account',
                [keyvals.AllocID]: 'AllocID',
                [keyvals.Product]: 'Product',
            }, 
            tagsOrder: ['35', '1', '460', '70'], 
            expected: [
                ['35', 'J'],
                ['1', 'account'],
                ['460', 'Product'],
                ['70', 'AllocID'],
            ] 
        },
        { 
            name: 'tags order not complete',
            msg: {
                [keyvals.MsgType]: 'J',
                [keyvals.Account]: 'account',
                [keyvals.AllocID]: 'AllocID',
                [keyvals.Product]: 'Product',
            }, 
            tagsOrder: ['35', '1'], 
            expected: [
                ['35', 'J'],
                ['1', 'account'],
                ['70', 'AllocID'],
                ['460', 'Product'],
            ] 
        },
    ])('With tag list', ({msg, tagsOrder, expected, name}) => {
        test(`should sort msg (${name})`, () => {
            expect(sortTags(msg, tagsOrder)).toEqual(expected)
        })
    })
})

interface DummyInterface {
     Symbol: string,
}
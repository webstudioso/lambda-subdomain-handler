const Request = require('../../models/request');
const eventMockStatic = require('./eventMockStatic.json');


describe('Request', () => {

    let event;

    beforeEach(() => {
        event = eventMockStatic;
    });

    test('Sets up constructor correctly from static media request', () => {
        const request = new Request({event});
        expect(request.getHost()).toBe('dappify.com');
    });

});
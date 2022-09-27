const Request = require('../../models/request');
const events = require('../mocks/events.json');

describe('Request', () => {

    let event;

    beforeEach(() => {

    });

    test('Sets up constructor correctly from static media request', () => {
        const request = new Request(events.studio_static_data);
        expect(request.getHost()).toBe('dappify.com');
    });

    test('getOriginUrl returns full url', () => {
        const requestA = new Request(events.studio_static_data);
        expect(requestA.getOriginUrl()).toBe('https://dev.dappify.com/static/media/Build.46a81f6a.mp4');
        const requestB = new Request(events.builder_static_data);
        expect(requestB.getOriginUrl()).toBe('https://testnew.dev.dappify.com/favicon.ico');
        const requestC = new Request(events.studio_root);
        expect(requestC.getOriginUrl()).toBe('https://www.dappify.com');
    });

    test('getCloudFunctionUrl returns valid url', () => {
        const requestA = new Request(events.builder_static_data);
        expect(requestA.getCloudFunctionUrl()).toBe('https://thjcx4hd30wp.usemoralis.com:2053/server/functions/getTemplateByDomain?_ApplicationId=RTrHB7FvD1yegNEQ0OS28QefKIlXJrmaa7HPYX8n&url=https://testnew.dappify.com&data=testnew.dappify.com');
    });

    test('setUri overrides existing uri', () => {
        const requestA = new Request(events.studio_static_data);
        const uri = '/test/me';
        requestA.setUri(uri);
        expect(requestA.get().uri).toBe(uri);
    });

    test('setUri returns overriden existing uri', () => {
        const requestA = new Request(events.studio_static_data);
        const uri = '/test/me';
        const reply = requestA.setUri(uri);
        expect(reply).toBe(uri);
    });

    test('isStaticContent returns true when /static/ path is contained', () => {
        const requestA = new Request(events.studio_static_data);
        expect(requestA.isStaticContent()).toBe(true);
    });

    test('isStaticContent returns true when uri is a file extension different than html', () => {
        const requestA = new Request(events.studio_static_data);
        requestA.setUri('/test/favicon.ico')
        expect(requestA.isStaticContent()).toBe(true);
        requestA.setUri('/test/image.png')
        expect(requestA.isStaticContent()).toBe(true);
        requestA.setUri('/test/video.mp4')
        expect(requestA.isStaticContent()).toBe(true);
        requestA.setUri('/test/audio.mp3')
        expect(requestA.isStaticContent()).toBe(true);
        requestA.setUri('/test/page.html')
        expect(requestA.isStaticContent()).toBe(false);
    });
});
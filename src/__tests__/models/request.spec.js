const Request = require('../../models/request');
const events = require('../mocks/events.json');

describe('Request', () => {

    let event;

    beforeEach(() => {

    });

    test('Sets up constructor correctly from static media request', () => {
        const request = new Request(events.studio_static_data);
        expect(request.getHost()).toBe('app.webstudio.so');
    });

    test('getOriginUrl returns full url', () => {
        const requestA = new Request(events.studio_static_data);
        expect(requestA.getOriginUrl()).toBe('https://app.dev.webstudio.so/static/media/Build.46a81f6a.mp4');
        const requestB = new Request(events.builder_static_data);
        expect(requestB.getOriginUrl()).toBe('https://testnew.dev.webstudio.so/favicon.ico');
        const requestC = new Request(events.studio_root);
        expect(requestC.getOriginUrl()).toBe('https://app.webstudio.so');
    });

    test('getCloudFunctionUrl returns valid url', () => {
        const requestA = new Request(events.builder_static_data);
        expect(requestA.getCloudFunctionUrl()).toBe('https://api.dev.webstudio.so/route/testnew.dev.webstudio.so');
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

    test('isStudio returns true when is a studio url', () => {
        const requestA = new Request(events.studio_static_data);
        expect(requestA.isStudio()).toBe(true);
        const requestB = new Request(events.studio_root);
        expect(requestB.isStudio()).toBe(true);
        const requestC = new Request(events.builder_static_data);
        expect(requestC.isStudio()).toBe(false);
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
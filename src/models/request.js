const path = require('path');

class Request {

    request;

    constructor(event) {
        this.request = {...event.Records[0].cf.request};
        console.log(`New request received ${JSON.stringify(this.request)}`);
    }

    getDefaultTemplate = () => {
        return this.request.origin.s3.customHeaders['x-dappify-default-template'][0].value;
    }

    getOrigin = () => {
        return this.request.headers['x-forwarded-host'][0].value;
    }

    getCloudFunctionUrl = () => {
        // const url = `https://${this.getHost()}`;
        // const serverAppId = this.request.origin.s3.customHeaders['x-provider-app-id'][0].value;
        const serverUrl = this.request.origin.s3.customHeaders['x-provider-server-url'][0].value;
        // const cfUrl = `${serverUrl}/functions/getTemplateByDomain?_ApplicationId=${serverAppId}&url=${url}&data=${this.getHost()}`;
        const apiUrl = `${serverUrl}/${this.getOrigin()}`
        console.log(`Cloud function url ${apiUrl}`);
        return apiUrl;
    }

    get = () => {
        return this.request;
    }

    getHost = () => {
        const forwardHost = this.getOrigin();
        return forwardHost.replace('staging.','').replace('dev.','').replace('www.','');
    }

    getOriginUrl = () => {
        const originHost = this.getOrigin() || '';
        // Remove trailing slashes from host and leading slashes from uri
        const hostWithoutTrailingSlashes = originHost.replace(/\/$/, '');
        const uriWithoutLeadingSlashes = this.request.uri.replace(/^\/+/, '');
        const originUrl = `https://${hostWithoutTrailingSlashes}/${uriWithoutLeadingSlashes}`;
        const originUrlWithoutTrailingSlashes = originUrl.replace(/\/$/, '')
        console.log(`Origin url is ${originUrlWithoutTrailingSlashes}`);
        return originUrlWithoutTrailingSlashes;
    }

    getRefererUrl = () => {
        // Referer is optional, usually passed when loading static content
        const referer = this.request.headers['referer'];
        const refererUrl = referer && referer.length > 0 ?referer[0].value : '';
        console.log(`Referer url is ${refererUrl}`);
        return refererUrl;
    }

    isPath = () => {
        return path.parse(this.request.uri).ext === '';
    }

    isStudio = () => {
        return this.getHost().includes('studio.');
    }

    isStaticContent = () => {
        const isNotHtml = !this.request.uri.endsWith('.html');
        const isStatic =    this.request.uri.includes('/static/') || 
                            this.request.uri.includes('/media/') ||
                            this.request.uri.includes('.');
        return isNotHtml && isStatic;
    }

    setUri = (newUri) => {
        this.request.uri = newUri;
        return this.request.uri;
    }

    getUri = () => {
        return this.request.uri;
    }

    prepareStudioRequest = () => {
        const defaultTemplate = this.getDefaultTemplate();
        if (this.isPath()) {
            // If path redirect to template/index.html
            this.setUri(`/${defaultTemplate}/index.html`);
        } else if (this.isStaticContent()) {
            // Static explicit content
            const uri = this.getUri();
            const uriComps = uri.split('/static/');
            if (uriComps.length > 1) {
                this.setUri(`/${defaultTemplate}/static/${uriComps[1]}`);
            } else {
                this.setUri(`/${defaultTemplate}${uri}`);
            }
        }
        return this.get();
    }

    prepareProjectRequest = (cid) => {
        this.request.origin = {
            custom: {
            domainName: 'ipfs.moralis.io',
            port: 2053,
            protocol: 'https',
            path: '',
            sslProtocols: ['TLSv1', 'TLSv1.1', 'TLSv1.2'],
            readTimeout: 5,
            keepaliveTimeout: 5,
            customHeaders: {}
            }
        }
        this.request.headers['host'] = [{ key: 'host', value: 'ipfs.moralis.io' }]
        const originallUri = this.request.uri === '/' ? '/index.html' : this.request.uri;
        const extensionUri = originallUri.includes('.') ? originallUri : `${originallUri}.html`;
        this.request.uri = `/ipfs/${cid}${extensionUri}`;
        return this.get();
    }
}

module.exports = Request;
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

    getCloudFunctionUrl = () => {
        const url = `https://${this.getHost()}`;
        const serverAppId = this.request.origin.s3.customHeaders['x-provider-app-id'][0].value;
        const serverUrl = this.request.origin.s3.customHeaders['x-provider-server-url'][0].value;
        const cfUrl = `${serverUrl}/functions/getTemplateByDomain?_ApplicationId=${serverAppId}&url=${url}&data=${this.getHost()}`;
        console.log(`Cloud function url ${cfUrl}`);
        return cfUrl;
    }

    get = () => {
        return this.request;
    }

    getHost = () => {
        const forwardHost = this.request.headers['x-forwarded-host'][0].value;
        return forwardHost.replace('staging.','').replace('dev.','').replace('www.','');
    }

    getOriginUrl = () => {
        const originHost = this.request.headers['x-forwarded-host'][0].value || '';
        // Remove trailing slashes from host and leading slashes from uri
        const hostWithoutTrailingSlashes = originHost.replace(/\/$/, '');
        const uriWithoutLeadingSlashes = this.request.uri.replace(/^\/+/, '');
        const originUrl = `https://${hostWithoutTrailingSlashes}/${uriWithoutLeadingSlashes}`;
        const originUrlWithoutTrailingSlashes = originUrl.replace(/\/$/, '')
        console.log(`Origin url is ${originUrlWithoutTrailingSlashes}`);
        return originUrlWithoutTrailingSlashes;
    }

    isPath = () => {
        return path.parse(this.request.uri).ext === '';
    }

    isStudio = () => {
        const host = this.getHost();
        const isDappifyStudio = host === 'dappify.com' || host === 'dappify.cc';
        console.log(`Is dappify studio url ${isDappifyStudio}`);
        return isDappifyStudio;
    }
}

module.exports = Request;
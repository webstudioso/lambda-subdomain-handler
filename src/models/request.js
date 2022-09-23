class Request {

    request;

    constructor({event}) {
        this.request = event.Records[0].cf.request;
        console.log(`New request received ${JSON.stringify(this.request)}`);
    }

    getDefaultTemplate = () => {
        return this.request.origin.s3.customHeaders['x-dappify-default-template'][0].value;
    }

    getCloudFunctionUrl = () => {

        const url = `https://${this.host}`;
        const serverAppId = this.request.origin.s3.customHeaders['x-provider-app-id'][0].value;
        return `${serverUrl}/functions/getTemplateByDomain?_ApplicationId=${serverAppId}&url=${url}&data=${host}`;
    }

    get = () => {
        return this.request;
    }

    getHost = () => {
        const forwardHost = this.request.headers['x-forwarded-host'][0].value;
        return forwardHost.replace('staging.','').replace('dev.','').replace('www.','');
    }
}

module.exports = Request;
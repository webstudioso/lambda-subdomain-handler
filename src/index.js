'use strict';
const Request = require('./models/request');


const lruCache = require('./utils/cache.js');
const utilsPath = require('./utils/path.js');
const eventUtils = require('./utils/event');
const https = require('https');
const path = require('path');
const cache = new lruCache.LRUCache(10000);


const handler =  (event, context, callback) => {
    
    const requestHandler = new Request({event});
    const host = requestHandler.getHost();
    const defaultTemplate = requestHandler.getDefaultTemplate();
    const request = requestHandler.get();

    // Match any '/' that occurs at the end of a URI. Replace it with a default index.html
    const isPath = path.parse(request.uri).ext === '';
    var olduri = request.uri;
    if (olduri.indexOf(".") === -1) {
          olduri = olduri + '\/'
    }
    olduri = olduri.replace(/\/\//, '\/');
    request.uri = olduri.replace(/\/$/, '\/index.html');
    console.log(`Meta request.uri ${request.uri}`);

    // const fullHost = request.headers['x-forwarded-host'][0].value;
    // const host = fullHost.replace('staging.','').replace('dev.','').replace('www.','');
    // console.log(`Host ${fullHost} to parsed without env ${host}`);
   
    if (host === 'dappify.com' || host === 'dappify.cc') {
        console.log(`Studio request ${host}`);
        request.uri = isPath ? `/${defaultTemplate}/index.html` : `/${defaultTemplate}${request.uri}`;
        console.log(`Redirecting to ${request.uri}`);
        cache.put(host, defaultTemplate);
        return callback(null, request);
    }
  
    // Has [legacy] explicit template provided? e.g https://<template>.<subdomain>.dappify.com
    const uriComponents = host.split('.');
    if (uriComponents.length === 4) {
        const templateTarget = uriComponents[0];
        console.log(`Template provided as part of first uri component ${templateTarget}`);
        request.uri = isPath ? `/${templateTarget}/index.html` : `/${templateTarget}${request.uri}`;
        return callback(null, request);
    }

    // Is static content? if so use the referer e.g https://demo.dev.dappify.com/tokenizer to pull
    const isStaticContent = request.uri.includes('/static') || request.uri.includes('.');
    console.log(`Is static content ${isStaticContent} with referer ${JSON.stringify(request.headers['referer'])}`);
    if (request.headers['referer'] && isStaticContent) {
      const ref = request.headers['referer'][0].value;
      const refComponents = ref.split('/');
      // e.g subd.dappify.com
      const basePath = refComponents[2];
      // e.g marketplace
      const templatePath = refComponents[3];
      // Remove everything between template and /static in uri
      const uriComps = request.uri.split('/static/');
      if (uriComps.length > 0) {
        request.uri = `/${templatePath}/static/${uriComps[1]}`;
        console.log(`Redirecting static path to uri ${request.uri}`);
        return callback(null, request);
      } else {
        request.uri = `/${templatePath}/${uriComps[0]}`;
        console.log(`Redirecting static path to uri ${request.uri}`);
        return callback(null, request);
      }
    }
  
    // Has [new] explicit template provided? e.g https://<subdomain>.dappify.com/<template>
    const uriTemplate = utilsPath.getTemplateFromUri(request.uri);
    if (uriTemplate !== null) {
        console.log(`Template provided as part of first path component ${uriTemplate}`);
        request.uri = isPath ? `/${uriTemplate}/index.html` : request.uri;
        return callback(null, request);
    }

    // If cached, redirect
    const cachedTemplateValue = cache.get(host);
    if (cachedTemplateValue !== -1) {
        request.uri = isPath ? `/${cachedTemplateValue}/index.html` : `/${cachedTemplateValue}${request.uri}`;
        console.log(`Found in cache, redirecting to ${request.uri}`);
        return callback(null, request);
    }
        
    const url = `https://${host}`;
    const requestUrl = `${serverUrl}/functions/getTemplateByDomain?_ApplicationId=${serverAppId}&url=${url}&data=${host}`;
    https.get(requestUrl, (resp) => {
      let data = '';
    
      // A chunk of data has been received.
      resp.on('data', (chunk) => {
        data += chunk;
      });
    
      // The whole response has been received. Print out the result.
      resp.on('end', () => {
        const response = JSON.parse(data);
        request.uri = isPath ? `/${response.result.config.type}/index.html` : `/${response.result.config.type}${request.uri}`;
        cache.put(host, response.result.config.type);
        console.log(`Redirecting to ${request.uri}`);
        return callback(null, request);
      });
    
    }).on("error", (err) => {
      console.log("Error: " + err.message);
      console.log(`Redirecting to ${request.uri}`);
      request.uri = isPath ? `/${defaultTemplate}/index.html` : `/${defaultTemplate}{request.uri}`;
      return callback(null, request);
    });
};

module.exports = handler
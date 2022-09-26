'use strict';
const Request = require('./models/request');
const axios = require('axios');
const _ = require('lodash');

const lruCache = require('./utils/cache.js');
const utilsPath = require('./utils/path.js');
const eventUtils = require('./utils/event');
const https = require('https');
const path = require('path');
const cache = new lruCache.LRUCache(10000);


const handler =  async (event, context, callback) => {
    
    const requestHandler = new Request(event);
    const host = requestHandler.getHost();
    const defaultTemplate = requestHandler.getDefaultTemplate();
    const request = requestHandler.get();
    console.log(`Initial request ${JSON.stringify(request)}`);
    console.log(`Initial URI ${request.uri}`);
    console.log("INIT LOGIC")
    let referenceTemplate = 'studio';
    // Load information about project
    const cachedTargetUrl = cache.get(requestHandler.getOriginUrl());
    if (cachedTargetUrl !== -1) {
        // Is cached, redirect
        request.uri = cachedTargetUrl;
        console.log(`Redirecting static path to uri ${request.uri} from cache hit`);
        return callback(null, request);
    } else {
        const response = await axios.get(requestHandler.getCloudFunctionUrl());
        const project = response?.data?.result;
        if (!_.isEmpty(project)) {
          console.log(`Project found ${JSON.stringify(project)}`);
          referenceTemplate = !_.isEmpty(project.config.type) ? project.config.type : Object.keys(project.config.template)[0];
          // Resolve IPFS
          if (!_.isEmpty(project.hash)) {
            console.log(`IPFS hash found ${project.hash}`);
            callback(null, {
              status: "302",
              statusDescription: "Found",
              headers: {
                location: [
                  {
                    key: "Location",
                    value: `https://dappify.mypinata.cloud/ipfs/${project.hash}`
                  }
                ],
                "aws-redirect-from": [{key:"aws-redirect-from", value: host}] 
              }
            })
          }
          // Resolve templates studio, try first from uri if provided
          else if (!_.isEmpty(project.config.type)) {
              const uriTemplate = utilsPath.getTemplateFromUri(request.uri);
              // Found in uri
              if (!_.isEmpty(uriTemplate)) {
                // request.uri = requestHandler.isPath() ? `/${uriTemplate}/index.html` : request.uri;
                // console.log(`Template found is path, setting to index ${request.uri}`);
                // return callback(null, request);
              } else {
                // Not defined in uri, use default or first template key
                // request.uri = requestHandler.isPath() ? `/${referenceTemplate}/index.html` : request.uri;
                // console.log(`Template default found is config ${configTemplate}, setting to index ${request.uri}`);
                // return callback(null, request);
              }
          }
        } else {
          console.log('Project not found, this is studio or invalid address');
          // Resolve studio
          if (requestHandler.isStudio()) {

          } else {
            console.log(`Invalid request ${JSON.stringify(request)}`);
          }
        }
        // Final request
        console.log(`Final request ${JSON.stringify(request)}`);
        console.log(`Final URI ${request.uri}`);
        // Store in cache here
    }
    console.log("END LOGIC")


    // Match any '/' that occurs at the end of a URI. Replace it with a default index.html
    const isPath = path.parse(request.uri).ext === '';
    var olduri = request.uri;
    if (olduri.indexOf(".") === -1) {
          olduri = olduri + '\/'
    }
    olduri = olduri.replace(/\/\//, '\/');
    request.uri = olduri.replace(/\/$/, '\/index.html');
    console.log(`Meta request.uri ${request.uri}`);
   
    // if (host === 'dappify.com' || host === 'dappify.cc') {
    //     console.log(`Studio request ${host}`);
    //     request.uri = isPath ? `/${defaultTemplate}/index.html` : `/${defaultTemplate}${request.uri}`;
    //     console.log(`Redirecting to ${request.uri}`);
    //     cache.put(host, defaultTemplate);
    //     return callback(null, request);
    // }
  
    // Has [legacy] explicit template provided? e.g https://<template>.<subdomain>.dappify.com
    // const uriComponents = host.split('.');
    // if (uriComponents.length === 4) {
    //     const templateTarget = uriComponents[0];
    //     console.log(`Template provided as part of first uri component ${templateTarget}`);
    //     request.uri = isPath ? `/${templateTarget}/index.html` : `/${templateTarget}${request.uri}`;
    //     return callback(null, request);
    // }

    // Is static content? if so use the referer e.g https://demo.dev.dappify.com/tokenizer to pull
    const isStaticContent = request.uri.includes('/static') || request.uri.includes('.');
    console.log(`Is static content ${isStaticContent} with referer ${JSON.stringify(request.headers['referer'])}`);
    if (request.headers['referer'] && isStaticContent) {
      // const ref = request.headers['referer'][0].value;
      // const refComponents = ref.split('/');
      // // e.g subd.dappify.com
      // const basePath = refComponents[2];
      // // e.g marketplace
      // const templatePath = refComponents[3];
      // Remove everything between template and /static in uri
      const uriComps = request.uri.split('/static/');
      console.log(`Splitting ${request.uri} by /static/ has ${uriComps.length} length`);
      if (uriComps.length > 1) {
        request.uri = `/${referenceTemplate}/static/${uriComps[1]}`;
        console.log(`Redirecting static path to uri with static prefix ${request.uri}`);
        return callback(null, request);
      } else {
        request.uri = `/${referenceTemplate}${request.uri}`;
        console.log(`Redirecting static path to uri without static prefix ${request.uri}`);
        return callback(null, request);
      }
    }
  
    // Has [new] explicit template provided? e.g https://<subdomain>.dappify.com/<template>
    // const uriTemplate = utilsPath.getTemplateFromUri(request.uri);
    // if (uriTemplate !== null) {
    //     console.log(`Template provided as part of first path component ${uriTemplate}`);
    //     request.uri = isPath ? `/${uriTemplate}/index.html` : request.uri;
    //     return callback(null, request);
    // }

    // If cached, redirect
    // const cachedTemplateValue = cache.get(host);
    // if (cachedTemplateValue !== -1 && !cachedTemplateValue.includes('//')) {
    //     request.uri = isPath ? `/${cachedTemplateValue}/index.html` : `/${cachedTemplateValue}${request.uri}`;
    //     console.log(`Found in cache, redirecting to ${request.uri}`);
    //     return callback(null, request);
    // }
        


    request.uri = isPath ? `/${referenceTemplate}/index.html` : `/${referenceTemplate}${request.uri}`;
    cache.put(host, referenceTemplate);
    console.log(`Final Redirecting to ${request.uri}`);
    return callback(null, request);

    // https.get(requestHandler.getCloudFunctionUrl(), (resp) => {
    //   let data = '';
    
    //   // A chunk of data has been received.
    //   resp.on('data', (chunk) => {
    //     data += chunk;
    //   });
    
    //   // The whole response has been received. Print out the result.
    //   resp.on('end', () => {
    //     const response = JSON.parse(data);
    //     // Is builder IPFS?
    //     // const proj = response.result;
    //     // const targetTemp = !_.isEmpty(proj?.config.type) ? proj?.config.type : Object.keys(proj?.config.template)[0];
    //     request.uri = isPath ? `/${referenceTemplate}/index.html` : `/${referenceTemplate}${request.uri}`;
    //     cache.put(host, targetTemp);
    //     console.log(`Redirecting to ${request.uri}`);
    //     return callback(null, request);
    //   });
    
    // }).on("error", (err) => {
    //   console.log("Error: " + err.message);
    //   console.log(`Redirecting to ${request.uri}`);
    //   request.uri = isPath ? `/${defaultTemplate}/index.html` : `/${defaultTemplate}{request.uri}`;
    //   return callback(null, request);
    // });
};

module.exports = handler
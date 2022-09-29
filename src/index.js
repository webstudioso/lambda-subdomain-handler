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
    console.log(`Received request with data ${JSON.stringify(request)}`);

    let referenceTemplate = 'studio';
    const originUrl = requestHandler.getOriginUrl();
    // Load information about project
    const cachedTargetUrl = cache.get(originUrl);
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
          // Resolve IPFS but don't cache yet
          if (!_.isEmpty(project.hash)) {
            const destination = `https://dappify.mypinata.cloud/ipfs/${project.hash}`;
            console.log(`IPFS hash found ${project.hash} redirecting to destination ${destination}`);
            return callback(null, {
              status: "302",
              statusDescription: "Found",
              headers: {
                location: [
                  {
                    key: "Location",
                    value: destination
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
                // console.log(`Template found is config ${referenceTemplate}, setting to index ${request.uri}`);
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
    console.log("New logic end")

    if (requestHandler.isPath()) {
        // If path redirect to template/index.html
        request.uri = `/${referenceTemplate}/index.html`;
        console.log(`Path to uri with template ${request.uri}`)
        requestHandler.setUri(request.uri);
    } else if (requestHandler.isStaticContent() && request.headers['referer']) {
        // Static explicit content
        const uriComps = request.uri.split('/static/');
        console.log(`Splitting ${request.uri} by /static/ has ${uriComps.length} length`);
        if (uriComps.length > 1) {
          request.uri = `/${referenceTemplate}/static/${uriComps[1]}`;
          console.log(`Static path to uri with static prefix ${request.uri}`);
          requestHandler.setUri(request.uri);
        } else {
          request.uri = `/${referenceTemplate}${request.uri}`;
          console.log(`Static path to uri without static prefix ${request.uri}`);
          requestHandler.setUri(request.uri);
        }
    }

    const finalRequest = requestHandler.get();
    console.log(`Finally redirecting to ${finalRequest}`);
    cache.put(originUrl, finalRequest.uri);
    return callback(null, finalRequest);
};

module.exports = handler
'use strict';
const Request = require('./models/request');
const axios = require('axios');

const handler =  async (event, context, callback) => {

    const request = new Request(event);
    console.log(`[REQUEST] Received ${JSON.stringify(request.get())}`);
    let response;
    // Studio request e.g. studio.dev.dappify.com/* / studio.dappify.com/*
    if (request.isStudio()) {
      console.log(`[REQUEST] Processing studio request}`);
      response = request.prepareStudioRequest();
    } else {
      // Load project data
      const configResponse = await axios.get(request.getCloudFunctionUrl());
      const project = configResponse?.data?.result;
      const cid = project?.hash;
      if (cid) {
        console.log(`[REQUEST] processing project request for CID ${cid}`);
        response = request.prepareProjectRequest(cid);
      }
    }
    console.log(`[REQUEST] Transformed to ${JSON.stringify(response)}`);
    return callback(null, response || request.get());
};

module.exports = handler
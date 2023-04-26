'use strict';
const Request = require('./models/request');
const axios = require('axios');

const handler =  async (event, context, callback) => {

    const request = new Request(event);
    console.log(`[REQUEST] Received ${JSON.stringify(request.get())}`);
    let response;
    // App request e.g. app.dev.webstudio.com/* / app.webstudio.so/*
    if (request.isStudio()) {
      console.log(`[REQUEST] Processing studio request}`);
      response = request.prepareStudioRequest();
    } else {
      const configResponse = await axios.get(request.getCloudFunctionUrl());
      const cid = configResponse?.data?.cid;
      if (cid) {
        console.log(`[REQUEST] processing project request for CID ${cid}`);
        response = request.prepareProjectRequest(cid);
      } else {
        console.log(`[NO MAPPING] this origin does not have any CID mapping, showing error page`);
        response = request.prepareErrorPage();
      }
    }
    console.log(`[REQUEST] Transformed to ${JSON.stringify(response)}`);
    return callback(null, response || request.get());
};

module.exports = handler
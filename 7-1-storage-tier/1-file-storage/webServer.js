/**
 * A simple Node.js program for exporting the current working directory via a
 * webserver listing on a hard code (see portno below) port. To start the
 * webserver run the command:
 *    node webServer.js
 *
 * Note that anyone able to connect to localhost:3001 will be able to fetch any
 * file accessible to the current user in the current directory or any of its
 * children.
 */

const fs = require('node:fs');

const express = require("express");

const portno = 3011; // Port number to use

const app = express();

app.get("/", function (request, response) {
  response.send("Simple web server of files from " + __dirname);
});

app.get("/save", function (request, response) {
  if (!request.query.objId || !request.query.data) {
    return response.send("objId or data not provided");
  }

  let objId = request.query.objId;
  let data = request.query.data;

  fs.writeFile(`data/${objId}`, data, err => {
    if (err) {
      console.error(err);
      response.send("Failed to save data");
    } else {
      response.send("Data saved!");
    }
  });
});

app.get("/read/:objId", function (request, response) {
  let objId = request.params.objId;

  fs.readFile(`data/${objId}`, 'utf8', (err, data) => {
    if (err) {
      response.send(`Reading data from data/${objId}<br />Data does not exist!`);
      return;
    }
    response.send(`Reading data from data/${objId}<br />${data}`);
  });
});

const server = app.listen(portno, function () {
  const port = server.address().port;
  console.log(
    "Listening at http://localhost:" +
      port +
      " exporting the directory " +
      __dirname
  );
});

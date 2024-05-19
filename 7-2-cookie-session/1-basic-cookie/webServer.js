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

const cookieParser = require('cookie-parser');

const portno = 3011; // Port number to use

const app = express();

app.use(cookieParser());

app.get("/", function (request, response) {
  response.send("Simple web server of cookies from " + __dirname + '<br />' + JSON.stringify(request.cookies));
});

app.get("/set", function (request, response) {
  let randomNumber = Math.random().toString();
  randomNumber = randomNumber.substring(2,randomNumber.length);
  response.cookie('cookieDemo',randomNumber, { maxAge: 900000, httpOnly: true });
  response.send('cookie created successfully. ' + randomNumber);
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

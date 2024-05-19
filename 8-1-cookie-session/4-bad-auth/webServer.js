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
  if (request.cookies.loggedInAs == 'admin') {
    response.send("Welcome web master! You can do anything here :)");
  } else {
    response.send("Welcome visitor! You can only read info here. If you are the web master, please login.")
  }
});

app.get("/login", function (request, response) {
  if (!request.query.id || !request.query.pw) {
    return response.send("ID or password not provided");
  }

  if (request.query.id != 'admin' || request.query.pw != '123456') { // wrong ID / PW
    return response.send("Wrong ID or password");
  } else {
    response.cookie('loggedInAs', 'admin', { maxAge: 900000, httpOnly: true });
    return response.send("Welcome web master. You have been logged in. Please go back to home page.");
  }
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

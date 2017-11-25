/*eslint-env node*/

//------------------------------------------------------------------------------
// hello world app is based on node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');
var bodyParser = require ('body-parser');
var request = require('request');

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

// create a new express server
var app = express();

//Here we are configuring express to use body-parser as middle-ware.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

app.get('/',function(req, res) {
  res.sendfile("index.html");
});

app.post('/submit-watsonml-data', function (req, res) {
    var watsonMLParams = 
    req.body.maximumSpeed + ' ' + 
    req.body.avgSpeed + ' ' + 
    req.body.isSeatBeltOff + ' ' + 
    req.body.distance + ' ' + 
    req.body.isSeatBeltOffs;
    
    res.send(watsonMLParams + ' Submitted Successfully!');
});

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {

	// print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});

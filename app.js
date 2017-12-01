/*eslint-env node*/

//------------------------------------------------------------------------------
// hello world app is based on node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');
var bodyParser = require ('body-parser');
var request = require('request');
var requestPromise = require('request-promise');

var username = '3371dca4-0d4d-4cab-9f5e-64de24f8211e';
var password = '646fdee3-f2de-4375-a507-3844f2450b8c';

// Telematics ML Endpoint
//var endpointURL = 'https://ibm-watson-ml.mybluemix.net/v3/wml_instances/1a1d7850-d272-4603-8195-44c364679bed/published_models/03d55368-5c4a-430a-8c26-2cabfb53ef87/deployments/1f0bc55f-1cca-4d99-b1f6-0fcc95f9f3d9/online';

// Fleet Maintenance ML Endpoint
var endpointURL = 'https://ibm-watson-ml.mybluemix.net/v3/wml_instances/1a1d7850-d272-4603-8195-44c364679bed/published_models/ad152522-bf80-43f0-8797-5a9e795bacb1/deployments/a3817601-4dc6-4d63-bb01-2bea73c99720/online';

// Watson ML Endpoint for acquiring the access token before actual invocation
var tokenEndpointURL = 'https://ibm-watson-ml.mybluemix.net/v3/identity/token';

var auth = 'Basic ' + new Buffer(username + ':' + password).toString('base64');

// Prepare the header
var postheaders = {
    'Content-Type' : 'application/json',
    'Authorization' : auth
};

/*
var endPointOptions = {
  url: endpointURL,
  method : 'POST',
  headers : postheaders
};
*/

var accessTokenOptions = {
  url: tokenEndpointURL,
  method : 'GET',
  headers : postheaders
};
// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

// create a new express server
var app = express();

// set the view engine to ejs
app.set('view engine', 'ejs');

//Here we are configuring express to use body-parser as middle-ware.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

/*
app.get('/',function(req, res) {
  res.sendfile("index.html");
});
*/

app.get('/',function(req, res) {
  	res.render('pages/index');
});

// about page 
app.get('/about', function(req, res) {
    res.render('pages/about');
});

// WatsonMLResponse page
app.get('/WatsonMLResponse', function(req, res) {
	//var WMLFinalResponse = ''+app.get('WatsonMLResponse');
    res.render('pages/predictionResponse', {WMLFinalResponse:app.get('WatsonMLResponse')});
});

app.post('/submit-watsonml-data', function (req, res) {
	// DEBUG: Obtain the features from the form
    //var watsonMLParams = req.body.maximumSpeed + ' ' + req.body.avgSpeed + ' ' + req.body.isSeatBeltOff + ' ' + req.body.distance + ' ' + req.body.isSeatBeltOffs;

	requestPromise(accessTokenOptions).then(function(response) {
            // Handle the response
            console.log('Handle the initial response');
            console.log("Response: ", JSON.stringify(response));
            
            // Obtain the access token from the first invoke
            var tokenResponse = JSON.parse(response);
            var securityToken = tokenResponse.token;
		
			// Assemble the request payload
			//var maxSpeed = parseInt(req.body.maximumSpeed, 10);
			//var avgSpeed = parseInt(req.body.avgSpeed, 10);
			var tripDistance = parseInt(req.body.distance, 10);
			
			// Fleet Maintenance Predictive Payload
			var payload = 
			{
				"fields":["ModelName", "AssetType", "distance"],
				"values":[["IMPALA","Car",tripDistance],["EQUINOX","SUV",tripDistance]]
			};
			
			// Telematics payload
			/*
			var payload = 
			{
				"fields":["MaximumSpeed","IsSeatBeltOff","AverageSpeed","Distance","IsSeatBeltOffs"],
				//"values":[[100,"false",90,200,"false"]]
				"values":[[maxSpeed,req.body.isSeatBeltOff,avgSpeed,distance,"false"]]
			};
			*/
			          
			// Prepare the 2nd calling header and insert the bearer token in the header
			var watsonMLInvokeHeaders = {
			    //'Content-Type' : 'application/json; charset=utf-8',
			    'Content-Type' : 'application/x-www-form-urlencoded',
			    'Accept' : 'application/json',
			    'Authorization' : 'Bearer ' + securityToken,
			    'Content-Length' : Buffer.byteLength(JSON.stringify(payload), 'utf8')
			};
			          
            // Assembling the final header and payload
            var watsonMLEndpointOptions = {
				url: endpointURL,
				method : 'POST',
  				headers : watsonMLInvokeHeaders,
  				body : JSON.stringify(payload)
			};

			//Invoking the actual Watson ML Scoring Endpoint
			request(watsonMLEndpointOptions, function(error2, response2, body2) {
				if(error2){
					console.error("Error while communication with Watson ML api and ERROR is : " + error2);
		       		res.send("Error while communication with Watson ML api and ERROR is : "+error2);
		    	}
		        console.log("Watson ML Endpoint Invoked and Scoring Response is : "+body2);
		        
		        //Set the response in the app so that the redirect can use it to render
		        app.set('WatsonMLResponse',JSON.stringify(body2));
		        res.redirect("/WatsonMLResponse");
		        
		        //Debugging line to see the raw output of the ML Endpoint
		        //res.send("Invoke Options: "+JSON.stringify(watsonMLEndpointOptions)+"\n Watson ML Endpoint Invoked and Scoring Response is : "+JSON.stringify(body2)); 			
		        
		    });
	})
    .catch(function(error) {
        // Deal with the error
        console.log('Error = ' + error);
        res.send("Error Response: "+error);
    });

});

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {

// print a message when the server starts listening
console.log("server starting on " + appEnv.url);
});

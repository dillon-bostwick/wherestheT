var cors    = require('cors'); //Cross origin
var opbeat  = require('opbeat');
var express = require('express');
var unirest = require('unirest'); //For requesting external objects
var bodyParser = require('body-parser')
var util = require('util');

var app = express();

app.set('port', (process.env.PORT || 5000));

//Middleware
app.use(cors());
app.use(opbeat.middleware.express())
app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Setting up mongo 
var MongoClient = require('mongodb').MongoClient, format = require('util').format;
var db = MongoClient.connect('mongodb://localhost/redline', function(error, databaseConnection) {
	db = databaseConnection;
}); 

////////////////////////////////////////////////////////////////////////////////////

//Add to the visitors collection
app.post('/addvisitor', function(req, res) {
	db.collection('visitors', function(error, coll) {
		var id = coll.insert(req.body, function(error, saved) {
			if (error) {
				res.sendStatus(500);
			} else {
				res.sendStatus(200);
			}
	    });
	});
});

//Display the visitor list (mostly copied from Ming's code)
app.get('/visitorlist', function(request, response) {
	response.set('Content-Type', 'text/html');
	var indexPage = '';

	db.collection('visitors', function(err, collection) {
		collection.find().toArray(function(err, cursor) {
			if (!err) {
				for (var count = 0; count < cursor.length; count++) {
					indexPage += "<p>Visitor at lat: " + cursor[count].lat + ", long: " + cursor[count].lng + "</p>";
				}

				indexPage += "</body></html>"
				response.send(indexPage);
			} else {
				response.send('<!DOCTYPE HTML><html><body><h1>Whoops, something went wrong!</h1></body></html>');
			}
		});
	});
});

//Main instance of the redline app
app.get('/', function(req, res) {
	res.redirect("/index.html");
})

////////////////////////////////////////////////////////////////////////////////////

app.get('/redline.json', function (req, res) {
	//Unirest simplifies the process of requesting the object. red is
	//the variable that copies the original MBTA json
	unirest.get('http://developer.mbta.com/lib/rthr/red.json')
	.send()
	.end(response=> {
		if (response.ok) {
			res.status(200).send(response.body);
		} else {
			console.log("Got an error: \n\n", response.error);;
		}
	})
})

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
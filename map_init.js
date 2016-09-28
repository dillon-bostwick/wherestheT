//By Dillon Bostwick for MBTA project for Tufts Comp20 with Ming Chow

function init()
{
	var stations    = new Array(stations_json.length);
	var trackCoords = new Array(stations_json.length);
	var map         = make_map();

	for (var i = 0; i < stations_json.length; i++) {
		var coord = {
			lat: parseFloat(stations_json[i].lat),
			lng: parseFloat(stations_json[i].long)
		}
		
		stations[i]    = new Station(stations_json[i].name, coord, map);
		trackCoords[i] = coord;
	}

	//Create the polylines for the train tracks:
	//From Alewife to Ashmont
	make_line(trackCoords.slice(ALEWIFE, ASHMONT), '#FF0000', map);
	//From JFK-UMass directly to North Quincy, then to Braintree
	make_line([trackCoords[JFK_UMASS]].concat(trackCoords.slice(NORTH_QUINCY, BRAINTREE)), '#FF0000', map)
	//Find current location (does not double check browser support!) and do stuff
	navigator.geolocation.getCurrentPosition(position_handler(stations, map));
	//Update train icons AND each station's arriving list
	train_update(stations, map); //Can eventually set to fetch data on time intervals
}

 ////////////////////////////////////////////////////////////////////////////

 function position_handler(stations, map) {
	return function(position) {
		var myLocation = {
			lat: position.coords.latitude,
			lng: position.coords.longitude
		};

		//send location to the visitors collection in the db
		$.ajax({
			type: 'POST',
			data: myLocation,
			url: '/addvisitor',
			dataType: 'json'
		})

		var myLocationMarker = new google.maps.Marker({
			position: myLocation,
			map: map
		})

		var closestStation = closest_station(myLocation, stations);

		//Round to two decimal places when showing distance in info window
		var myLocationInfoWindow = new google.maps.InfoWindow({
			content: "Your nearest red line station: <b>" + 
					 closestStation.name + "</b><br>Distance: <b>" +
					 haversine_distance(myLocation, closestStation.position).toFixed(2) +
					 "</b> mi"
		})

		myLocationMarker.addListener('click', function() {
    		myLocationInfoWindow.open(map, myLocationMarker);
  		});

		//Create polyline from closestStation to myLocation
		make_line([myLocation, closestStation.position], '#000000', map)
	}
}

 ////////////////////////////////////////////////////////////////////////////

function train_update(stations, map) {
	$.getJSON("https://corsenabledredline.herokuapp.com/redline.json", function(key) {
		var trains = key.TripList.Trips; //object as per MBTA specs

		for (var t = 0; t < trains.length; t++) {
			//Put train icon on map if it is listed (certain trains never
			//list their position coordinates)
			if (trains[t].hasOwnProperty("Position")) {
				new google.maps.Marker({
					position: {
						lat: trains[t].Position.Lat,
						lng: trains[t].Position.Long
					},
					icon: "train_logo.png",
					map: map
				});
			}

			//Update each station with next trains to the station
			for (var p = 0; p < trains[t].Predictions.length; p++) {
				for (var s = 0; s < stations.length; s++) {
					if (stations[s].name == trains[t].Predictions[p].Stop) {
						stations[s].arriving[trains[t].Destination].push(trains[t].Predictions[p].Seconds)
					}
				}
			}
		}

		//Add event listeners to create info windows for each station
		for (var i = 0; i < stations.length; i++) {
			//add_station_window(stations[i], map)	
			google.maps.event.addListener(stations[i].marker, 'click', function(stations, i) {
				return function() {
					var w = new google.maps.InfoWindow();
					w.setContent("<h3>" + stations[i].name + "</h3>" + make_info_string(stations[i].arriving));
					w.open(map, stations[i].marker);
				}
			}(stations, i));
		}
	});
}

////////////////////////////////////////////////////////////////////////////////

//---Station class---
//name:     string
//position: Google LatLng literal
//arriving: 3 arrays of strings of integers
//marker:   Google Marker object
function Station(name, position, map) {
	this.name = name;
	this.position = position;
	this.arriving = {
		Alewife:   [],
		Ashmont:   [],
		Braintree: []
	};
	this.marker = new google.maps.Marker({
		position: position,
		title: name,
		icon: "red_line_logo.png",
		map: map
	});
}

function make_map() {
	var myOptions = {
		zoom: 13,
		center: {lat: 42.352271, lng: -71.05524},
		mapTypeId: google.maps.MapTypeId.ROADMAP
	};

	return new google.maps.Map(document.getElementById("map_canvas"), myOptions);
}

//Pass a string of hexidecimal for color and an array of LatLngs for coords
//Doesn't store the polyline anywhere, so it will never be manipulated later
function make_line(coords, color, map) {
	return new google.maps.Polyline({
		path: coords,
		geodesic: true,
		strokeColor: color,
		strokeOpacity: 1.0,
		strokeWeight: 2,
		map: map
	});
}

//Create an html string of info for an info window given a list of
//arriving trains
function make_info_string(arrivingList) {
	var infoString = "";

	for (var dest in arrivingList) {
		if (arrivingList[dest].length !== 0) {
			arrivingList[dest].sort(compareNums); //b/c sort defaults to ASCII

			infoString += "<b>" + dest + "</b><br>"

			for (var t = 0; t < arrivingList[dest].length; t++) {
				infoString += sectostr(arrivingList[dest][t]) + "<br>";
			}
		}
	}

	if (infoString === "") {
		return "No trains arriving";
	} else {
		return infoString;
	}
}

//Find the closest LatLng to target from the Marker array points, using the Haversine formula
function closest_station(target, stations) {
	var closestStation = stations[0]
	var bestDistance   = haversine_distance(target, stations[0].position);
	var newDistance;

	for (var i = 1; i < stations.length; i++) {
		newDistance = haversine_distance(target, stations[i].position);
		if (newDistance > bestDistance) {
			closestStation = stations[i];
			bestDistance   = newDistance;
		}
	}

	return closestStation;
}

//http://stackoverflow.com/questions/14560999/using-the-haversine-formula-in-javascript
//I refactord heavily for readability
//Note: returns miles
function haversine_distance(coords1, coords2) {
	//TODO: Fix for miles instead of km
  var dLat = toRad(coords2.lat - coords1.lat);
  var dLon = toRad(coords2.lng - coords1.lng)

  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(toRad(coords1.lat)) * Math.cos(toRad(coords2.lat)) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);

  return 7917.5314 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
 }

 function toRad(x) {
 	return x * Math.PI / 180;
 }

 function compareNums(a, b) {
    return a - b;
}

//http://stackoverflow.com/questions/3733227/javascript-seconds-to-minutes-and-seconds
//Converts seconds as an integer to fancy minute:second format as a string
//I refactored for readability
 function sectostr(time) {
	return ~~(time / 60) + ":" + (time % 60 < 10 ? "0" : "") + time % 60;
 }

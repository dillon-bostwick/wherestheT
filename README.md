# Nearest MBTA Distance

## Dillon Bostwick for Tufts Comp20

### July 20th, 2016
Stores all the stations, displays them with a unique logo, and shows the polyline between each station according to the tracks in real life. More to come.
Time: ~5 hours

### July 26th, 2016
Finds your location and shows you your nearest station. Pulls data from a Heroku server synced with MBTA JSON (premade by Ming) and shows location of trains on the track as well as next arriving trains for each station.
Time: ~8 hours

### Aug 9th, 2016
Run app.js on a node.js server. Procfile allows for Heroku hoisting. map_init.js is updated to pull data from https://corsenabledredline.herokuapp.com/redline.json, which is the URI of the Heroku app running node app.js. The server is the same as the MBTA server except that it is CORS enabled. Also records the location of all visitors and stores in a MongoDB collection called "visitors."

LIST OF ROUTES:

localhost:5000              - redirects to index.html  
localhost:5000/index.html   - original redline UI (client-side script not changed since part 2 other than where it pulls its data)
localhost:5000/addvisitor   - (POST) will add a document containing a latlng to the "visitors" collectin
localhost:5000/visitorlist  - see (in rough HTML) list of latlngs of all past visitors
localhost:5000/redline.json - CORS enabled real-time data from the MBTA (still using the deprecated MBTA API)
(OR corsenabledredline.heroku.com/redline.json)

Time: <1 hour making a CORS enabled json transfer, and another 2 hours dealing with the Heroku repos and some detached heads in the tuftsdev repo, and about 3 hours making the Mongo POST route for the extra credit
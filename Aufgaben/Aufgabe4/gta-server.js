/**
 * Template für Übungsaufgabe VS1lab/Aufgabe3
 * Das Skript soll die Serverseite der gegebenen Client Komponenten im
 * Verzeichnisbaum implementieren. Dazu müssen die TODOs erledigt werden.
 */

/**
 * Definiere Modul Abhängigkeiten und erzeuge Express app.
 */

var http = require('http');
//var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var express = require('express');

var app;
app = express();
app.use(logger('dev'));
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({
    extended: false
}));

// Setze ejs als View Engine
app.set('view engine', 'ejs');

/**
 * Konfiguriere den Pfad für statische Dateien.
 * Teste das Ergebnis im Browser unter 'http://localhost:3000/'. */
app.use(express.static(__dirname + "/public"));


/**
 * Konstruktor für GeoTag Objekte.
 * GeoTag Objekte sollen min. alle Felder des 'tag-form' Formulars aufnehmen.
 */
function GeoTagObj(id, latitude, longitude, name, hashtag) {
	this.id = id;
	this.latitude = latitude;
	this.longitude = longitude;
	this.name = name;
	this.hashtag = hashtag;
}


/**
 * Modul für 'In-Memory'-Speicherung von GeoTags mit folgenden Komponenten:
 * - Array als Speicher für Geo Tags.
 * - Funktion zur Suche von Geo Tags in einem Radius um eine Koordinate.
 * - Funktion zur Suche von Geo Tags nach Suchbegriff.
 * - Funktion zum hinzufügen eines Geo Tags.
 * - Funktion zum Löschen eines Geo Tags.
 */
 
 
 var GeoTagModul = ( function() {
	 geoTagArray = [];

	 var isInRadius = function(lat1, long1, lat2, long2, radius) {
		return radius >= Math.sqrt( Math.pow(lat1 - lat2, 2) 
								+ Math.pow(long1 - long2, 2)
								)
	 }
	 
	 return {
		getGeoTagByID: function(id) {
			geoTagResult = null;
			if(id >= 0) {
				for(var i = 0; i < geoTagArray.length; i++) {
					if( geoTagArray[i].id == id ) {
						geoTagResult = new GeoTagObj(geoTagArray[i].id, geoTagArray[i].latitude, geoTagArray[i].longitude, geoTagArray[i].name, geoTagArray[i].hashtag);
						break;
					}
				}
			}
			return geoTagResult;
		 },

		 searchRadius: function(latitude, longitude, radius) {
			geoTagResult = [];
			for(var i = 0; i < geoTagArray.length; i++) {
				if( isInRadius(latitude, longitude, geoTagArray[i].latitude, geoTagArray[i].longitude, radius) ) {
					geoTagResult.push(new GeoTagObj(geoTagArray[i].id, geoTagArray[i].latitude, geoTagArray[i].longitude, geoTagArray[i].name, geoTagArray[i].hashtag));
				}
			}
			return geoTagResult;
		 },
		 
		 searchName: function(name) {
			geoTagResult = [];
			for(var i = 0; i < geoTagArray.length; i++) {
				if( geoTagArray[i].name == name ) {
					geoTagResult.push(new GeoTagObj(geoTagArray[i].id, geoTagArray[i].latitude, geoTagArray[i].longitude, geoTagArray[i].name, geoTagArray[i].hashtag));
				}
			}
			console.log("There were found " + geoTagResult.length + " of " + geoTagArray.length + " GeoTags");
			return geoTagResult;
		 },
		 
		 add: function(latitude, longitude, name, hashtag) {
			var geoTagID = geoTagArray.length;
			geoTagArray.push(new GeoTagObj(geoTagID, latitude, longitude, name, hashtag));
			console.log("A new GeoTag has been added. Now: " + geoTagArray.length);
			return geoTagID;
		 },
		 
		 remove: function(name) {
             for(var i = 0; i < geoTagArray.length; i++) {
                 if( geoTagArray[i].name == name ) {
                 	geoTagArray.splice(i, 1);
                 	i--;
                 }
             }
		 }
	 };
 })();

/**
 * Route mit Pfad '/' für HTTP 'GET' Requests.
 * (http://expressjs.com/de/4x/api.html#app.get.method)
 *
 * Requests enthalten keine Parameter
 *
 * Als Response wird das ejs-Template ohne Geo Tag Objekte gerendert.
 */

app.get('/', function(req, res) {
    res.render('gta', {
        taglist: GeoTagModul.searchRadius(req.body.lati, req.body.long, 0.01),
		latitude: "",
		longitude: ""
    });
});


/**
 * R E S T - A P I 
 * - [POST] /geotags 				 -> Add a GeoTag. 
 * - [GET]  /geotags/__id__ 		 -> return the GeoTag with the right ID.
 * - [GET]  /geotags?search=__NAME__ -> return GeoTags with a searchterm (Name).
 */


/**
 * Add a GeoTag with POST.
 * return: 	All GeoTags within a radius of 0.01
 */
app.post('/geotags', function(req, res) {
	var geoTagID = GeoTagModul.add(req.body.lati,req.body.long, req.body.name, req.body.hash);
	res.setHeader("Content-type", "application/json");
	res.location('/geotags/' + geoTagID);
	res.statusCode = 201;
	res.send(GeoTagModul.searchRadius(req.body.lati, req.body.long, 0.01));
	console.log("Location: /geotags/" + geoTagID);
});

/**
 * GeoTags with a path by id (example: /geotags/1 -> return GeoTag->ID->1).
 * return: 	A GeoTag with the ID.
 * 			Or "[]" wich mean null.
 */
app.get('/geotags/:id', function(req, res) {
	var geoTag = GeoTagModul.getGeoTagByID(req.params.id);
	res.send((geoTag == null) ? "[]" : geoTag);
});

/**
 * GeoTags with a search-attribute (Name) (example: /geotags?search=test).
 * GeoTags with a remove-attribute (Name) (example: /geotags?remove=test).
 * return: 	All GeoTags with this name.
 * 			Or "[]" wich mean null.
 */
app.get('/geotags', function(req, res) {
	var name = req.query.search;
	var remove = req.query.remove;	
	if(name != undefined) {	
		res.send(GeoTagModul.searchName(name));
	} else if(remove != undefined) {
		GeoTagModul.remove(remove)
		res.send(GeoTagModul.searchName(remove));
	}
});



/**
 * Setze Port und speichere in Express.
 */

var port = 3000;
app.set('port', port);

/**
 * Erstelle HTTP Server
 */

var server = http.createServer(app);

/**
 * Horche auf dem Port an allen Netzwerk-Interfaces
 */

server.listen(port);

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
function GeoTagObj(latitude, longitude, name, hashtag) {
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
		 searchRadius: function(latitude, longitude, radius) {
			geoTagResult = [];
			for(var i = 0; i < geoTagArray.length; i++) {
				if( isInRadius(latitude, longitude, geoTagArray[i].latitude, geoTagArray[i].longitude, radius) ) {
					geoTagResult.push(new GeoTagObj(geoTagArray[i].latitude, geoTagArray[i].longitude, geoTagArray[i].name, geoTagArray[i].hashtag));
				}
			}
			return geoTagResult;
		 },
		 
		 searchName: function(name) {
			geoTagResult = [];
			for(var i = 0; i < geoTagArray.length; i++) {
				if( geoTagArray[i].name == name ) {
					geoTagResult.push(new GeoTagObj(geoTagArray[i].latitude, geoTagArray[i].longitude, geoTagArray[i].name, geoTagArray[i].hashtag));
				}
			}
			return geoTagResult;
		 },
		 
		 add: function(latitude, longitude, name, hashtag) {
			geoTagArray.push(new GeoTagObj(latitude, longitude, name, hashtag));
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
        taglist: [],
		latitude: "",
		longitude: ""
    });
});

/**
 * Route mit Pfad '/tagging' für HTTP 'POST' Requests.
 * (http://expressjs.com/de/4x/api.html#app.post.method)
 *
 * Requests enthalten im Body die Felder des 'tag-form' Formulars.
 * (http://expressjs.com/de/4x/api.html#req.body)
 *
 * Mit den Formulardaten wird ein neuer Geo Tag erstellt und gespeichert.
 *
 * Als Response wird das ejs-Template mit Geo Tag Objekten gerendert.
 * Die Objekte liegen in einem Standard Radius um die Koordinate (lat, lon).
 */

app.post('/tagging', function(req, res) {
	GeoTagModul.add(req.body.latitude, req.body.longitude, req.body.name, req.body.hashtag);
    res.render('gta', {
        taglist: GeoTagModul.searchRadius(req.body.latitude, req.body.longitude, 0.01),
		latitude: req.body.latitude,
		longitude: req.body.longitude
    });
});

/**
 * Route mit Pfad '/discovery' für HTTP 'POST' Requests.
 * (http://expressjs.com/de/4x/api.html#app.post.method)
 *
 * Requests enthalten im Body die Felder des 'filter-form' Formulars.
 * (http://expressjs.com/de/4x/api.html#req.body)
 *
 * Als Response wird das ejs-Template mit Geo Tag Objekten gerendert.
 * Die Objekte liegen in einem Standard Radius um die Koordinate (lat, lon).
 * Falls 'term' vorhanden ist, wird nach Suchwort gefiltert.
 */
 
app.post('/discovery', function(req, res) {

    if(req.body.remove != undefined) {
        GeoTagModul.remove(req.body.searchterm);
	}
    res.render('gta', {
        taglist: GeoTagModul.searchName(req.body.searchterm),
		latitude: "",
		longitude: ""
    });
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

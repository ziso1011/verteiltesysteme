/* Dieses Skript wird ausgeführt, wenn der Browser index.html lädt. */

// Befehle werden sequenziell abgearbeitet ...

/**
 * "console.log" schreibt auf die Konsole des Browsers
 * Das Konsolenfenster muss im Browser explizit geöffnet werden.
 */
console.log("The script is going to start...");

// Ajax wird initalisiert und listener wird erzeugt.
var ajax = new XMLHttpRequest();

/**
 * After adding a GeoTag, this function will be called, which then updates the list.
 */
ajax.onreadystatechange = function() {
    if (ajax.readyState == 4) {
        console.log("Client: GeoTag received from server.");
        console.log("Client: Update GeoTag-View.");
        console.log(ajax.responseText);
        var resJson = JSON.parse(ajax.responseText);
        document.getElementById("results").innerHTML = "";
        for(var i = 0; i < resJson.length; i++) {
            document.getElementById("results").innerHTML += "<li>" + resJson[i].name + " ( " + resJson[i].latitude + ", " + resJson[i].longitude + " ) " + resJson[i].hashtag + " </li>";
        }
        // Update the Map with the last point (last point = latest entry)
        gtaLocator.update();
    }
};

/**
 * Add a GeoTag
 */
function addGeoTag() {
    if(document.getElementById("tag-form-name").value != "") 
    {
        ajax.open('POST', '/geotags', true);
        ajax.setRequestHeader("Content-type", "application/json");
        var json = {
            "lati":document.getElementById("tag-form-latitude").value, 
            "long":document.getElementById("tag-form-longitude").value, 
            "name":document.getElementById("tag-form-name").value, 
            "hash":document.getElementById("tag-form-hashtag").value
        };
        ajax.send(JSON.stringify(json));
        console.log("Client: GeoTag send to server.");
    } else {
        console.log("Client: Name required.");
    }
}


/**
 * Search a GeoTag
 */
function searchGeoTag() {
    if(document.getElementById("filter-form-searchterm").value != "") 
    {
        ajax.open('GET', '/geotags?search=' + document.getElementById("filter-form-searchterm").value, true);
        ajax.setRequestHeader("Content-type", "application/json");
        ajax.send(null);
        console.log("Client: GeoTag-Search-Query send to server. Search-Term: " + document.getElementById("filter-form-searchterm").value);
    } else {
        console.log("Client: Search-Name required.");
    }
}

/**
 * Delete a GeoTag
 */
function removeGeoTag() {
    if(document.getElementById("filter-form-searchterm").value != "") 
    {
        ajax.open('GET', '/geotags?remove=' + document.getElementById("filter-form-searchterm").value, true);
        ajax.setRequestHeader("Content-type", "application/json");
        ajax.send(null);
        console.log("Client: GeoTag-Remove-Query send to server. Remove-Term: " + document.getElementById("filter-form-searchterm").value);
    } else {
        console.log("Client: Remove-Name required.");
    }
}

/**
 * GeoTagApp Locator Modul
 */
var gtaLocator = (function GtaLocator() {

    // Private Member

    /**
     * Funktion spricht Geolocation API an.
     * Bei Erfolg Callback 'onsuccess' mit Position.
     * Bei Fehler Callback 'onerror' mit Meldung.
     * Callback Funktionen als Parameter übergeben.
     */
    var tryLocate = function (onsuccess, onerror) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(onsuccess, function (error) {
                var msg;
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        msg = "User denied the request for Geolocation.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        msg = "Location information is unavailable.";
                        break;
                    case error.TIMEOUT:
                        msg = "The request to get user location timed out.";
                        break;
                    case error.UNKNOWN_ERROR:
                        msg = "An unknown error occurred.";
                        break;
                }
                onerror(msg);
            });
        } else {
            onerror("Geolocation is not supported by this browser.");
        }
    };

    // Auslesen Breitengrad aus der Position
    var getLatitude = function (position) {
		if(document.getElementById("tag-form-latitude").value == "")
			return position.coords.latitude;
		else
			return document.getElementById("tag-form-latitude").value;
    };

    // Auslesen Längengrad aus Position
    var getLongitude = function (position) {
		if(document.getElementById("tag-form-longitude").value == "")
			return position.coords.longitude;
		else
			return document.getElementById("tag-form-longitude").value;
    };

    // Hier Google Maps API Key eintragen
    var apiKey = "AIzaSyCRUQCKV5VRQrzTa1fFFjURyX1k6tLjzQg";

    /**
     * Funktion erzeugt eine URL, die auf die Karte verweist.
     * Falls die Karte geladen werden soll, muss oben ein API Key angegeben
     * sein.
     *
     * lat, lon : aktuelle Koordinaten (hier zentriert die Karte)
     * tags : Array mit Geotag Objekten, das auch leer bleiben kann
     * zoom: Zoomfaktor der Karte
     */
    var getLocationMapSrc = function (lat, lon, tags, zoom) {
        zoom = typeof zoom !== 'undefined' ? zoom : 10;

        if (apiKey === "YOUR API KEY HERE") {
            console.log("No API key provided.");
            return "images/mapview.jpg";
        }

        var tagList = "";
        if (typeof tags !== 'undefined') tags.forEach(function (tag) {
            tagList += "&markers=%7Clabel:" + tag.name
                + "%7C" + tag.latitude + "," + tag.longitude;
        });

        var urlString = "http://maps.googleapis.com/maps/api/staticmap?center="
            + lat + "," + lon + "&markers=%7Clabel:you%7C" + lat + "," + lon
            + tagList + "&zoom=" + zoom + "&size=640x480&sensor=false&key=" + apiKey;

        console.log("Generated Maps Url: " + urlString);
        return urlString;
    };

   

    return { // Start öffentlicher Teil des Moduls ...

        // Public Member

        readme: "Dieses Objekt enthält 'öffentliche' Teile des Moduls.",

        update: function () {
		tryLocate(function (position){
			document.getElementById("tag-form-latitude").value = getLatitude(position);
			document.getElementById("tag-form-longitude").value = getLongitude(position);
			document.getElementById("filter-form-latitude").value = getLatitude(position);
			document.getElementById("filter-form-longitude").value = getLongitude(position);
            document.getElementById("result-img").src = getLocationMapSrc(getLatitude(position), getLongitude(position), undefined, 16)
    		},
		function () {
			alert("Position konnte nicht ermittelt werden!")
		});
        }

    }; // ... Ende öffentlicher Teil
})();

/**
 * $(document).ready wartet, bis die Seite komplett geladen wurde. Dann wird die
 * angegebene Funktion aufgerufen. An dieser Stelle beginnt die eigentliche Arbeit
 * des Skripts.
 */
$(document).ready(function () {
    gtaLocator.update();
    document.getElementById("btnAddGeoTag").addEventListener("click", function() { addGeoTag(); });
    document.getElementById("tag-form-hashtag").addEventListener("keydown", function(e) { if(e.keyCode === 13) addGeoTag(); });

    document.getElementById("btnSearchByName").addEventListener("click", function() { searchGeoTag(); });
    document.getElementById("filter-form-searchterm").addEventListener("keydown", function(e) { if(e.keyCode === 13) searchGeoTag(); });

    document.getElementById("btnRemoveByName").addEventListener("click", function() { removeGeoTag(); });
});

var baseRegex = "([ABCDEFGHKLMNOPRSTUVWYZ][A-Z]{3}|[0-9]([0-9][A-Z]|[A-Z][0-9])|[A-Z][0-9]{2})";
var idR = new RegExp("\\b" + baseRegex + "\\b", "g");
var idMatchR = new RegExp(baseRegex, "g"); //Might want to make sure we set the flags correctly here.

var runOnceDomains = null;
var neverRunDomains = null;
var ignoreIDs = null;
var linkColor = null;
var linkDecoration = null;
var usURLBase = null;
var nonUSURLBase = null;
var infoStyle = "hovertext";
var debug = false;
var groundspeed = 0;

var visited = {};

function log(message) {
  if (debug) {
    console.log(message);
  }
}

function getSVMap(id) {
  chrome.runtime.sendMessage ({command: "aideOpenSkyVectorMap", startWaypoint:myLat + "," + myLon, endWaypoint:id + ""}, function (response){return true;});
}

function assignOnclicks(clickers) {
  var clickers=document.getElementsByClassName('aideSVMapCandidate');
  for (var i in clickers) {
    var e = clickers[i];
    if (e.children && e.children.length == 0 && e.text != "") {
      e.onclick=function(e) {getSVMap(this.text);};
    }
  }
}

function readPrefs() {
  chrome.storage.local.get(["pref-link-color","pref-link-decoration","pref-run-once","pref-never-run","pref-never-run",
          "pref-link-site","pref-link-site-custom","pref-ignore-airport-ids","pref-debug","pref-groundspeed","pref-info-style"], function(items) {
    for (var i in items) {
      if ("pref-link-color" == i) {
        linkColor = items[i];
      } else if ("pref-ignore-airport-ids" == i) {
        ignoreIDs = items[i].split("\n");
      } else if ("pref-run-once" == i) {
        runOnceDomains = items[i].split("\n");
      } else if ("pref-never-run" == i) {
        neverRunDomains = items[i].split("\n");
      } else if ("pref-info-style" == i) {
        infoStyle = items[i];
      } else if ("pref-link-site" == i) {
        urltype = items[i];
        //Don't do anything on urltype custom or default
        if (urltype == "default") {
          usURLBase = "http://www.airnav.com/airport/%id";
          nonUSURLBase = "http://www.gcmap.com/airport/%id";
        } else if (urltype == "gcmap") {
          usURLBase = "http://www.gcmap.com/airport/%id";
          nonUSURLBase = "http://www.gcmap.com/airport/%id";
        } else if (urltype == "skyvector-info") {
          usURLBase = "http://skyvector.com/airport/%id";
          nonUSURLBase = usURLBase;
        } else if (urltype == "skyvector-map") {
          usURLBase = "href=\"javascript:void(0)\" class='aideSVMapCandidate'";
          nonUSURLBase = usURLBase;
        }
      } else if ("pref-link-site-custom" == i) {
        if (usURLBase == null) {
          usURLBase = items[i];
          nonUSURLBase = items[i];
        }
      } else if ("pref-link-decoration" == i) {
        linkDecoration = "";

        if (/none/.test(items[i])) {
          linkDecoration = "text-decoration: none;";
        } else if (/browser-default/.test(items[i])) {
          linkDecoration = "";
        } else {
          if (/bold/.test(items[i])) {
            linkDecoration = "font-weight: bold;"
          }
          if (/underline/.test(items[i])) {
            linkDecoration = linkDecoration + " text-decoration: underline;";
          } else {
            linkDecoration = linkDecoration + " text-decoration: none;";
          }
        }
      } else if ("pref-debug" == i) {
        debug = items[i] == "true";
        log("Debug enabled");
      } else if ("pref-groundspeed" == i) {
        if (items[i] != "") {
          groundspeed = parseInt(items[i]);
        }
      }
    }

    if (neverRunDomains == null) neverRunDomains = [];
    if (runOnceDomains == null) runOnceDomains = [];
    if (ignoreIDs == null) ignoreIDs = [];
    if (linkColor == null) linkColor = "inherit";
    if (linkDecoration == null) linkDecoration = "";
    if (usURLBase == null || usURLBase == "") usURLBase = "http://www.airnav.com/airport/%id";
    if (nonUSURLBase == null || nonUSURLBase == "") nonUSURLBase = "http://www.gcmap.com/airport/%id";

    log("runOnceDomains: " + runOnceDomains);
    log("neverRunDoms: " + neverRunDomains);
    log("ignoreIDs: " + ignoreIDs);
    log("Color: " + linkColor);
    log("Decoration: " + linkDecoration);
    log("usURL: " + usURLBase);
    log("groundspeed: " + groundspeed);
    log("nonUSURL: " + nonUSURLBase);
  });
}

// TODO:
// Don't update version, but instead check timestamp of any blank airports data sets.
// If it's too old (a week?) delete the record and try it again.

var version = "1.42"; //Don't update unless you want a memory wipe.

var numElements = -1;

var myLat = null;
var myLon = null;

var mutex = 0;

function refreshGPS() {
  // Much quicker to do it from memory than calling for fresh coords.
  chrome.storage.local.get("gpsinfo", function(items) {
    for (var i in items) {
      myLat = items[i]["lat"];
      myLon = items[i]["lon"];
    } 
  });

  chrome.runtime.sendMessage ( {command: "aideGetLocation"}, function (response) {
    getLocation(response.geoLocation);
  } );
}

function checkUpgrade() {

  chrome.storage.local.get("lastupgrade", function(items) {
    for (var i in items) {
      if (items[i] == null || items[i].valueOf() != version.valueOf()) {
        //This one was to clear all cache... Use upgrade code with caution.
        log("upgrade code running...");
        chrome.storage.local.clear();
        var loc = {};
        loc["lat"] = myLat;
        loc["lon"] = myLon;
        var map = {};
        map["lastupgrade"] = version;
        map["gpsinfo"] = loc;
        chrome.storage.local.set(map);
      }
    }
  });
}

function getLocation(location) {
  //Store it.
  var loc = {};
  loc["lat"] = location.lat;
  loc["lon"] = location.lon;
  var tuple = {};
  tuple["gpsinfo"] = loc;
  chrome.storage.local.set(tuple);

  if (myLat == null) {
    //Want to make sure we only do this once a page load
    myLat = location.lat;
    myLon = location.lon;
  }
}

function wcDataCallback(element, doc, airportID) {
  if (doc == null || doc.valueOf() == "") {
    //Make sure we don't cache a blank if jpr.pw is down.
    return false;
  }

  var status = valFromXpath("/result/status", doc);
  var airportInfo = {};
  airportInfo["id"] = airportID;
  var d = new Date;
  airportInfo["timestamp"] = d.getTime(); 

  if (status.valueOf() == "OK".valueOf()) {
    airportInfo["lat"] = valFromXpath("/result/lat", doc);
    airportInfo["lon"] = valFromXpath("/result/lon", doc);
    airportInfo["name"] = valFromXpath("/result/name", doc);
    airportInfo["city"] = valFromXpath("/result/city", doc);
    airportInfo["state"] = valFromXpath("/result/state", doc);
    airportInfo["country"] = valFromXpath("/result/country", doc);
    var tuple = {};
    tuple[airportID] = airportInfo;
    chrome.storage.local.set(tuple);
    fillElement(element, airportInfo);

  } else if (status.valueOf() == "NOT FOUND".valueOf()) {
    //Mark as invalid
    airportInfo["invalid"] = "invalid";

    var tuple = {};
    tuple[airportID] = airportInfo;
    chrome.storage.local.set(tuple);
  }

}

function getWebCacheData(element, airportID) {
  var eReq = new XMLHttpRequest();
  eReq.onload = function(result) {wcDataCallback(element, eReq.responseXML, airportID);};
  eReq.open("GET", "http://jpr.pw/extensions/airportidexpander/cache.jsp?id=" + airportID, true);
  eReq.send();
}

function distFromGPS(lat, lon) {
  if (lat == null || lon == null || myLat == null || myLon == null) {
    return "";
  }

  /** Converts numeric degrees to radians */
  if (typeof(Number.prototype.toRad) === "undefined") {
    Number.prototype.toRad = function() {
      return this * Math.PI / 180;
    }
  }

  myLat = parseFloat(myLat);
  myLon = parseFloat(myLon);
  lat = parseFloat(lat);
  lon = parseFloat(lon);

  var R = 3448; // nm
  var dLat = (myLat-lat).toRad();
  var dLon = (myLon-lon).toRad();
  var lat1 = lat.toRad();
  var lat2 = myLat.toRad();

  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; //result in nm.
  d = parseInt("" + d);
  return d;
}

// Translates a Google Maps request into data, calls fillElement.
function cacheGoogleResponse(element, doc, airportID) {
  var airportInfo = {};
  var isOk = valFromXpath("/GeocodeResponse/status", doc);
  if (isOk == null || "OK".valueOf() != isOk.valueOf()) {
    getWebCacheData(element, airportID);
    return;
  }

  isOk = searchValFromXpath("/GeocodeResponse/result/type", "airport", doc);
  if ("airport".valueOf() != isOk.valueOf()) {
    getWebCacheData(element, airportID);
    return;
  }

  isOk = valFromXpath("/GeocodeResponse/result/formatted_address", doc);
  if (!(new RegExp("(" + ("" + airportID).substring(1) + ")")).test(isOk)) {
    getWebCacheData(element, airportID);
    return;
  }

  airportInfo["id"] = airportID;
  airportInfo["lat"] = valFromXpath("/GeocodeResponse/result/geometry/location/lat", doc);
  airportInfo["lon"] = valFromXpath("/GeocodeResponse/result/geometry/location/lng", doc);
  airportInfo["name"] = valFromXpath("/GeocodeResponse/result/address_component[1]/short_name", doc);
  airportInfo["city"] = valFromXpath("/GeocodeResponse/result/address_component[type=\"locality\"]/long_name", doc);
  airportInfo["state"] = valFromXpath("/GeocodeResponse/result/address_component[type=\"administrative_area_level_1\"]/short_name", doc);
  airportInfo["country"] = valFromXpath("/GeocodeResponse/result/address_component[type=\"country\"]/short_name", doc);
  var d = new Date;
  airportInfo["timestamp"] = d.getTime(); 

  var tuple = {};
  tuple[airportID] = airportInfo;
  chrome.storage.local.set(tuple);
  fillElement(element, airportInfo);
}

function fillElement(element, info) {
  var id = info["id"];

  if (visited[id] != null && (visited[id].indexOf(element) != -1 || (element.parentElement != null && visited[id].indexOf(element.parentElement) != -1))) {
    mutex --;
    return true;
  }

  if (visited[id] == null) {
    visited[id] = [];
  }

  visited[id].push(element);

  var invalid = info["invalid"];
  if (invalid != null) {
    mutex -= 1;
    return;
  }

  //Differentiate based on ID location
  var urlBase = nonUSURLBase;
  if ((id + "").length == 3 || /^K/.test(id) || /^P/.test(id) || /^T/.test(id)) {
    urlBase = usURLBase;
  }

  var airportURL = urlBase.replace("%id", id + "").replace("%ulat", myLat + "").replace("%ulon", myLon + "")
                      .replace("%lat", info["lat"] + "").replace("%lon", info["lon"] + "");

  if (/^http/.test(airportURL)) {
    airportURL = "href = \"" + airportURL + "\"";
  }

  log("Adding to element " + element.innerHTML);

  var dist = distFromGPS(info["lat"], info["lon"]);
  var timeEnRoute = "";
  if (groundspeed > 0) {
    timeEnRoute = ", " + parseInt(parseInt(dist)/groundspeed) + "h" + parseInt(60*parseInt(parseInt(dist)%groundspeed)/groundspeed) + "m";
  }

  if (dist.valueOf() == "".valueOf()) {
    dist = "";
  } else {
    dist = " (" + dist + " nm" + timeEnRoute + ")";
  }

  var country = "";
  if (info["country"] && info["country"].valueOf() != "" && info["country"].valueOf() != "US") {
    country = ", " + info["country"];
  }

  var city = "";
  if (info["city"].valueOf() != info["name"].valueOf() && info["city"].valueOf() != "") {
    city = ", " + info["city"];
  }

  var state = "";
  if (info["state"].valueOf() != "") {
    state = ", " + info["state"];
  }

  var colorSegment = linkColor == "browser-default" ? "" : "color: " + linkColor + ";";

  var replaceHTML = null;
  if (/inline/.test(infoStyle)) {
    if (/nodist/.test(infoStyle)) {
      dist = "";
    }
    replaceHTML = "<a style=\"" + colorSegment + linkDecoration 
    + "font-size: inherit;\" " + airportURL + ">" + id + " ["
    + info["name"] + city + state + country + dist + "]</a>";
  } else {
    replaceHTML = "<a style=\"" + colorSegment + linkDecoration 
    + "font-size: inherit;\" " + airportURL + " title=\"" 
    + info["name"] + city + state + country + dist + "\">" + id + "</a>";
  }

  //Replace all simultaneously.
  element.innerHTML = element.innerHTML.replace(new RegExp(id,"g"), replaceHTML);
  assignOnclicks(element.children);
  
  mutex -= 1;
}

function lookup(airportID, element) {
  mutex += 1;
  chrome.storage.local.get(airportID, function(items) {
  var found = false;
  for (var item in items) {
    fillElement(element, items[item]);
    found = true;
  }

  if (!found) {
    var oReq = new XMLHttpRequest();
    oReq.onload = function(result) {cacheGoogleResponse(element, oReq.responseXML, airportID);};
    oReq.open("GET", "https://maps.googleapis.com/maps/api/geocode/xml?address=" + airportID + "&sensor=false", true);
    oReq.send();
  }
  });
}

var headElement = null;
function setHeadElement() {
  // First pass attempt at setting headElement
  if (document.all.size > 1) {
    if (document.all[1].nodeName.toUpperCase().valueOf() == "HEAD".toUpperCase().valueOf()) {
      headElement = document.all[1];
    }
  }
}

function checkPage() {
  //TODO: Refactor this out... apparently document.all isn't exactly the cat's meow.
  var elements = document.all;

  if (numElements < elements.length && mutex == 0) {
    for (var i in elements) {
      var element = elements[i];
      if (headElement == null) {
        if (element != null && element.innerHTML != null && (element.innerHTML.match("^<title>") != null 
                          || element.nodeName.toUpperCase().valueOf() == "HEAD".toUpperCase().valueOf())) {
          headElement = element;
        }
      }

      if (element && element.children && element.children.length == 0 && idR.test(element.textContent)) {
        if (headElement == null || !(headElement.contains(element) || headElement == element)) {
          var innerMatches = element.textContent.match(idR);
          for (var j in innerMatches) {
            var roughAirport = innerMatches[j]; //Returns junkICAOjunk
            var airport = roughAirport.match(idMatchR); //Gets ICAO
            if (ignoreIDs.indexOf(airport.valueOf() + "") == -1) {
              lookup(airport, element);
            }
          }
        }
      }
    }
  }

  numElements = document.all.length;

  if (runOnceDomains.indexOf(document.location.hostname.replace("www\.","").valueOf()) == -1) {
    // Do this again in a couple seconds.
    setTimeout(checkPage, 5000);
  }
}

var prefsTriggered = false;

function init() {
  if (runOnceDomains == null) {
    // Still waiting for prefs to be read in.  Want to wait for these.
    if (!prefsTriggered) {
      readPrefs();
      refreshGPS();
      checkUpgrade();
    }
    setTimeout(init, 2);
    return true;
  }

  if (neverRunDomains.indexOf(document.location.hostname.replace("www\.","").valueOf()) == -1) {
    var i = 0;
    var match = false;
    
    while (i < neverRunDomains.length && !match) {
      if (new RegExp("^" + neverRunDomains[i].replace(/\*/g,'.+') + "$").test(document.location.hostname.replace("www\.",""))) {
        log("Matched domain. Not running AIDE.");
        match = true;
      }
      i++;
    }

    if (!match) {
      // Run everything.
      setHeadElement();
      checkPage();
    }
  }
}

init();

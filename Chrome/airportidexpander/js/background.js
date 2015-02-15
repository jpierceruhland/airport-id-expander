chrome.runtime.onMessage.addListener (
  function (request, sender, sendResponse) {
    if (request.command == "aideGetLocation") {
      navigator.geolocation.getCurrentPosition (function (position) {
        console.log("Called the function");
        var ret = {};
        ret["lat"] = position.coords.latitude;
        ret["lon"] = position.coords.longitude;
        sendResponse( {geoLocation: ret} );
        });
      return true; // Needed because the response is asynchronous
    }
  });

chrome.runtime.onMessage.addListener (
  function (request, sender, sendResponse) {
    if (request.command == "aideOpenSkyVectorMap") {
      var start = request.startWaypoint;
      var end = request.endWaypoint;
      console.log("Opened a tab: " + start + " to " + end);
      chrome.tabs.create({url: "http://skyvector.com/#aide:" + start + ":" + end});
    }
  });


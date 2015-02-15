//Dynamically opens a tab from a click event.

var planString = "";
var timeout = 1000;

function clickPlan() {
  if (document.forms.length < 3 || document.getElementsByClassName("sv_panelrow").length == 0) {
    document.forms[1].elements[1].click();
    setTimeout(clickPlan, timeout);
  }
}

function drawPlan() {
  document.forms[1].elements[0].value = planString;
  setTimeout(clickPlan(), timeout);
}

function clearPlan() {
  if (document.forms.length == 3 || document.getElementsByClassName("sv_panelrow").length > 0) {
    document.forms[2].elements[1].click();
    setTimeout(clearPlan, timeout);
  } else {
    setTimeout(drawPlan, 1);
  }
}

function bringUpPlan() {
  if (document.forms.length < 2) {
    document.getElementsByClassName("sv sv_topbarlink")[0].click();
    setTimeout(bringUpPlan, timeout);
  } else {
    setTimeout(clearPlan, 1);
  }
}


function determineMapping() {
  if (/^#aide/.test(document.location.hash)) {
    var splitHash = document.location.hash.split("aide");
    planString = splitHash[splitHash.length - 1].replace(/:/g, " ").trim();
    setTimeout(bringUpPlan, 1);
  }
}

window.onload=(function() {determineMapping()})();


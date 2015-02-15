function $(id) {
   return document.getElementById(id);
}

function updateCustomVisibility(value) {
  if (value == "custom") {
    //set custom field visible
    $("link-site-custom").style.display = 'block'; 
    $("link-site-custom-text").style.display = 'block';
  } else {
    //set custom field invisible
    $("link-site-custom").style.display = 'none';
    $("link-site-custom-text").style.display = 'none';
  }
}

function sortPref(value) {
  return value.split("\n").sort().join("\n");
}

function updatePref(settings) {
  var id = this.id;
  var val = "";
  if ($(id).type == "checkbox") {
    val = this.checked + "";
  } else {
    if (id == "link-site") {
      val = $(id).selectedOptions[0].value;
      updateCustomVisibility(val);
    } else {
      val = $(id).value;
    }
  }

  var tuple = {};
  tuple["pref-" + id] = val;
  chrome.storage.local.set(tuple);
  console.log("Set setting pref-" + id + ": " + val);
}

function updateUICallback(items) {
  for (var i in items) {
    console.log(i);
    var idName = i.substring(5);
    var val = items[i];
    if ($(idName) != null && $(idName).type == "checkbox") {
      $(idName).checked = val == "true";
    } else {
      val = sortPref(items[i]);
      $(idName).value = val;
    }
    if (idName == "link-site") {
      updateCustomVisibility(val);
    }
  }
}

function updateUI() {
  chrome.storage.local.get(["pref-link-color", "pref-link-decoration", "pref-run-once", "pref-never-run", 
      "pref-ignore-airport-ids", "pref-link-site", "pref-link-site-custom", "pref-debug", "pref-groundspeed", "pref-info-style"],
         updateUICallback);
}

function toggleAdvanced() {
  document.getElementById('advanced-toggle').style.display = 'none';
  var arr = document.getElementsByClassName('advanced');
  for (var i in arr) {
    arr[i].style.display = 'block';
  }
}

function donate() {chrome.tabs.create({ url: "http://jpr.pw/extensions/airportidexpander/donate.html"});}

function feedback() {chrome.tabs.create({ url: "mailto:j@jpr.pw?Subject=Airport ID Expander feedback"});}

function init() {
  updateUI();
  //Dropdowns
  $('link-color').onchange = updatePref;
  $('link-decoration').onchange = updatePref;
  $('link-site').onchange = updatePref;
  $('info-style').onchange = updatePref;

  //Text fields
  $('run-once').onkeyup = updatePref;
  $('never-run').onkeyup = updatePref;
  $('ignore-airport-ids').onkeyup = updatePref;
  $('link-site-custom').onkeyup = updatePref;
  $('groundspeed').onkeyup = updatePref;

  //Checkboxes
  $('debug').onchange = updatePref;

  //Toggles
  $('advanced-toggle').onclick = toggleAdvanced;
  $('donate-toggle').onclick = donate;
  $('feedback').onclick = feedback;
}

document.addEventListener('DOMContentLoaded', init);


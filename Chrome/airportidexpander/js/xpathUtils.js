function valFromXpath(xpath, doc) {
  return searchValFromXpath(xpath, "", doc);
}

function searchValFromXpath(xpath, val, doc) {
  if (doc == null) {
    return null;
  }
  var nodes = doc.evaluate(xpath, doc, null, XPathResult.ANY_TYPE, null);
  var result = nodes.iterateNext();
  if (result && result.childNodes && result.childNodes.length > 0) {
    if (val.valueOf() == "".valueOf()) {
      result = result.childNodes[0].textContent;
      return result;
    } else {
      while (result && result.childNodes) {
        result = result.childNodes[0].textContent;
        if (result && result.valueOf() == val.valueOf()) {
          return result;
        }
        result = nodes.iterateNext();
      }
    }
  }

  return "";
}

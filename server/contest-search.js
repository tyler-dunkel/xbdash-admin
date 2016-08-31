SearchSource.defineSource('contests', function(searchText, options) {
  var options = {sort: {isoScore: -1}, limit: 20};
  
  if(searchText) {
    var regExp = buildRegExp(searchText);
    var selector = {$or: [
      {title: regExp},
      {type: regExp}
    ]};
    //console.log(xbdNews.find(selector, options).fetch());
    return xbdContests.find(selector, options).fetch();
  } else {
    //console.log(xbdNews.find({}, options).fetch());
    return xbdContests.find({}, options).fetch();
  }
});

function buildRegExp(searchText) {
  //var parts = searchText.trim().split(/[ \-\:]+/);
  //return new RegExp("(" + parts.join('|') + ")", "ig");
  return new RegExp(searchText, "ig");
}


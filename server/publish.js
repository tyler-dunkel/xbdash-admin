xbdNews = new Mongo.Collection("xbdnews");
xbdContests = new Mongo.Collection("xbdcontests");

Meteor.publish("allxbdnews", function(){
  return xbdNews.find();
});

Meteor.publish("allxbdcontests", function(){
  return xbdContests.find();
});

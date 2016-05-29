xbdNews = new Mongo.Collection("xbdnews");

Meteor.publish("allxbdnews", function(){
  return xbdNews.find();
});

xbdNews = new Mongo.Collection("xbdnews");
xbdContests = new Mongo.Collection("xbdcontests");
xbdAnnouncements = new Mongo.Collection("xbdannouncements");
xbdFeaturedContent = new Mongo.Collection("xbdfeaturedcontent");
Meteor.publish("allxbdnews", function(){
  return xbdNews.find();
});

Meteor.publish("allxbdcontests", function(){
  return xbdContests.find();
});

Meteor.publish("allxbdannouncements", function(){
  return xbdAnnouncements.find();
});

Meteor.publish("allxbdfeaturedcontent", function(){
  return xbdFeaturedContent.find();
});
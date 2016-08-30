
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

Meteor.publish('userCount', function() {
  Counts.publish(this, 'user-count', Meteor.users.find());
});

var start = new Date();
start.setHours(0,0,0,0);
var end = new Date();
end.setHours(23,59,59,999);
Meteor.publish('userCountToday', function() {
  Counts.publish(this, 'user-count-today', Meteor.users.find({createdAt: {$gte: start, $lt: end}}));
});

Meteor.publish('usersActiveToday', function() {
  Counts.publish(this, 'users-active-today', Meteor.users.find({"status.lastLogin.date": {$gte: start, $lt: end}}))
});
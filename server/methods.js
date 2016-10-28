import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

Meteor.methods({
    //Adds article to the database.
    addArticleServer(id, published, title, author, slug, source, linkhref, type, gameId, featuredImage, shareImage, wysiwygHtml) {
        var gameId = gameId.split(",");

        if (!this.userId) {
            throw new Meteor.error('not-authorized');
        }
        if (id === 'new') {
            id = "";
        }
        xbdNews.update(
            { _id: id },
            {
                "published": new Date(published),
                "updated": new Date(),
                "title": title,
                "content": wysiwygHtml,
                "link": {
                    "rel": "alternate",
                    "type": "text/html",
                    "href": linkhref
                },
                "author": author,
                "slug": slug,
                "source": source,
                "shareCount": null,
                "type": type,
                "gameId": gameId,
                "featuredImage": featuredImage,
                "shareImage": shareImage
            },
            { upsert: true }
        );
        return "Article Submitted";
    },

    //Adds contest to the database.
    addContestServer(id, status, contestToken, startDate, endDate, sendPrizeDate, type, data, prizes, rules) {
        if (!this.userId) {
            throw new Meteor.error('not-authorized');
        }
        if (id === 'new') {
            id = "";
        }
        xbdContests.update(
            { _id: id },
            {
                "status": status,
                "contestToken": contestToken,
                "startDate": new Date(startDate),
                "endDate": new Date(endDate),
                "sendPrizeDate": new Date(sendPrizeDate),
                "type": type,
                "data": data,
                "prizes": prizes,
                "rules": rules
            },
            { upsert: true }
        );
        return "Contest Submitted";
    },

    //Adds announcement to the database.
    addAnnouncementServer(id, title, summary, image, link, createdAt) {
        if (!this.userId) {
            throw new Meteor.error('not-authorized');
        }
        if (id === 'new') {
            id = "";
        }
        xbdAnnouncements.update(
            { _id: id },
            {
                "title": title,
                "summary": summary,
                "image": image,
                "link": link,
                "createdAt": new Date(createdAt)
            },
            { upsert: true }
        )
        return "Announcement submitted";
    },

    //Adds featured content to the database.
    addFeaturedContentServer(id, type, contentId) {
        if (!this.userId) {
            throw new Meteor.error('not-authorized');
        }

        xbdFeaturedContent.update(
            { _id: id },
            {
                "type": type,
                "contentId": contentId
            },
            { upsert: true }
        )

        return "Featured content updated";
    },

    //THIS DOES NOT WORK! (YET)
    //This is used to check if the logged in user is allowed to access the page.
    isUserAllowed(email) {
        //console.log(email);
        var allowedEmails = [
            'dylanrichardpearson@gmail.com',
            'tyler.dunkel@gmail.com'
        ];
        var isAllowed = false;
        for (var i = 0; i < allowedEmails.length; i++) {
            // console.log("Email: " + email + " checked against " + allowedEmails[i]);
            if (allowedEmails[i] === email) {
                isAllowed = true;
                break;
            }
        }
        // console.log(isAllowed);
        return isAllowed;
    },


    getFeaturedArticle() {
        var articleId = xbdFeaturedContent.find({ _id: 1 }).fetch()[0].contentId;
        return xbdNews.find({ _id: articleId }).fetch();
    },

    getFeaturedContest() {
        var contestId = xbdFeaturedContent.find({ _id: 2 }).fetch()[0].contentId;
        return xbdContests.find({ _id: contestId }).fetch();
    },

    getFeaturedClip() {
        var clipUrl = xbdFeaturedContent.find({ _id: 3 }).fetch()[0].contentId;
        return clipUrl;
    },

    getFeaturedImage() {
        var imageUrl = xbdFeaturedContent.find({_id: 4}).fetch()[0].contentId;
        return imageUrl;    
    }
});



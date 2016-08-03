import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

Meteor.methods({

    //Adds article to the database.
    addArticleServer(id, published, title, author, slug, source, linkhref, wysiwygHtml) {
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
                "id": [
                    ""
                ],
                "author": author,
                "slug": slug,
                "source": source,
                "contentType": {
                    "type": "html"
                },
                "shareCount": null
            },
            { upsert: true }
        );
        return "Article Submitted";
    },

    //Adds contest to the database.
    addContestServer(id, status, contestToken, startDate, endDate, sendPrizeDate, prizes, rules) {

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

    //This is used to check if the logged in user is allowed to access the page.
    isUserAllowed(email) {
        console.log(email);
        var allowedEmails = [
            'dylanrichardpearson@gmail.com',
            'tyler.dunkel@gmail.com'
        ];
        var isAllowed = false;
        for (var i = 0; i < allowedEmails.length; i++) {
            console.log("Email: " + email + " checked against " + allowedEmails[i]);
            if (allowedEmails[i] === email) {
                isAllowed = true;
                break;
            }
        }
        console.log(isAllowed);
        return isAllowed;
    }
});



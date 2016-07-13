Meteor.methods({

    //Adds article to the database.
    addArticleServer(id, published, title, author, slug, source, linkhref, wysiwygHtml) {
        if (id === 'new') {
            id = "";
        }
        xbdNews.update(
            { _id: id },
            {
                "published": published,
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

    },
    
    //Adds contest to the database.
    addContestServer(id, status, contestToken, startDate, endDate, sendPrizeDate, prizes, rules) {
        if (id === 'new') {
            id = "";
        }
        xbdContests.update(
            { _id: id },
            {
                "status": status,
                "contestToken": contestToken,
                "startDate": startDate,
                "endDate": endDate,
                "sendPrizeDate": sendPrizeDate,
                "prizes": prizes,
                "rules": rules
            },
            { upsert: true }
        );

    },

    //Adds announcement to the database.
    addAnnouncementServer(id, title, summary, image, link, createdAt) {
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
                "createdAt": createdAt
            },
            { upsert: true }
        )
    },

    //This is used to check if the logged in user is allowed to access the page.
    isUserAllowed(email){
        var allowedEmails = [
            'dylanrichardpearson@gmail.com',
            'tyler.dunkel@gmail.com'
            ];
        var isAllowed = false;
        for (var i = 0; i < allowedEmails.length; i++){
            if(allowedEmails[i] === email){
                isAllowed = true;
                break;
            }
        }
        return isAllowed;
    }


});



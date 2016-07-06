Meteor.methods({

    addArticleServer(id, published, title, author, slug, source, linkhref, wysiwygHtml) {
        if (id === 'new') {
            id = "";
        }
        xbdNews.update(
            {_id: id},
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
            {upsert: true}
        );

    },

    addContestServer(id, status, contestToken, startDate, endDate, sendPrizeDate, prizes, rules) {
        if (id === 'new') {
            id = "";
        }
        xbdContests.update(
            {_id: id},
            {
                "status": status,
                "contestToken": contestToken,
                "startDate": startDate,
                "endDate": endDate,
                "sendPrizeDate": sendPrizeDate,
                "prizes": prizes,
                "rules": rules
            },
            {upsert: true}
        );

    }
});

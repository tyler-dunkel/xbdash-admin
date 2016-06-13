Meteor.methods({

  addArticleServer(id, published, title, author, slug, source, wysiwygHtml) {
        xbdNews.insert({
          "_id":
          "published": published,
          "updated": new Date(),
          "title": title,
          "content": wysiwygHtml,
          "link": {
            "rel": "alternate",
            "type": "text/html",
            "href": "http://www.polygon.com/2016/4/27/11521818/hyper-light-drifter-co-op-beta"
          },
          "id": [
            "http://www.polygon.com/2016/4/27/11521818/hyper-light-drifter-co-op-beta"
          ],
          "author": author,
          "slug": slug,
          "source": source,
          "contentType": {
            "type": "html"
          },
          "shareCount": null
      });

  }
});

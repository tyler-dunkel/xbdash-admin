import React, {Component} from 'react';
import {SearchSource} from 'meteor/meteorhacks:search-source';
import TrackerReact from 'meteor/ultimatejs:tracker-react';
import ArticleSearchResult from './ArticleSearchResult.jsx';

let options = { keepHistory: 1000 * 60 * 5, localSearch: true };
let fields = ['articleTitle', 'author'];
SearchArticles = new SearchSource('articles', fields, options);

export default class ArticleSearch extends TrackerReact(Component) {

    getArticles() {
        return SearchArticles.getData({
            transform(matchText, regExp) {
                return matchText.replace(regExp, "<b>$&</b>")
            },
            sort: { isoScore: -1 }
        });
    }

    isLoading() {
        return SearchArticles.getStatus();
    }

    handleChange(e) {
        var text = $(e.target).val().trim();
        SearchArticles.search(text, options);
    }


    updateFeatured(articleId) {
        console.log(articleId);
         Meteor.call('addFeaturedContentServer', 1, "article", articleId, (error, result) => {
            console.log(error);
            console.log(result);
            if (error) {
                Materialize.toast('You are not authorized to update the featured article.');
            } else if (result) {
                Materialize.toast(result, 4000);
            }
        })
    }
    
    render() {
        if (this.isLoading().loaded != true) {
            return (
                <div>
                    <input type="text" id="search-box" placeholder="search articles here" onKeyUp={this.handleChange} />
                    <div>
                        Searching...
                    </div>
                </div>
            )
        }
        return (
            <div>
                <input type="text" id="search-box" placeholder="search articles here" onKeyUp={this.handleChange} />
                <div>
                    {console.log("articles " + this.getArticles()) }
                    <div className="collection">
                        {this.getArticles().map((article) => {
                            return <ArticleSearchResult onArticleClick={this.updateFeatured(article._id)} article={article} />
                        }) }
                    </div>
                </div>
            </div>
        )
    }
}
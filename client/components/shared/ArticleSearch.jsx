import React, {Component} from 'react';
import {SearchSource} from 'meteor/meteorhacks:search-source';
import TrackerReact from 'meteor/ultimatejs:tracker-react';

let options = { keepHistory: 1000 * 60 * 5, localSearch: true };
let fields = ['articleTitle', 'author'];
SearchArticles = new SearchSource('articles', this.fields, this.options);

export default class ArticleSearch extends TrackerReact(Component) {
    getArticles() {
        return SearchArticles.getData({
            transform(matchText, regExp) {
                return matchText.replace(regExp, "<b>$&</b>")
            }
        });
    }

    isLoading() {
        return SearchArticles.getStatus();
    }

    handleChange(e) {
        var text = $(e.target).val().trim();
        SearchArticles.search(text);
    }

    render() {
        console.log("is loading" +SearchArticles.getStatus());
        console.log("articles " + this.getArticles());
        if (this.isLoading().loaded!=true) {
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
                        {console.log("articles " + this.getArticles())}

                    {this.getArticles().map((article) => {
                        return <div>Result</div>
                    }) }
                </div>
            </div>
        )
    }
}
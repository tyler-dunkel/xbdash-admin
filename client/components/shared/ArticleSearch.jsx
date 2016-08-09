import React, {Component} from 'react';
import {SearchSource} from 'meteor/meteorhacks:search-source';

export default class ArticleSearch extends Component {

    constructor() {
        super();
        this.options = {
            keepHistory: 1000 * 60 * 5,
            localSearch: true
        };

        this.fields = ['articleTitle', 'author'];

        this.ArticleSearch = new SearchSource('articles', this.fields, this.options);
    }

    getArticles() {
        return this.ArticleSearch.getData({
            transform: function (matchText, regExp) {
                return matchText.replace(regExp, "<b>$&</b>")
            },
            sort: { isoScore: -1 }
        });
    }

    isLoading() {
        return this.ArticleSearch.getStatus().loading;
    }

    handleChange(e) {
            var text = $(e.target).val().trim();
            this.ArticleSearch.search(text);
            console.log(text);
    }



    render() {


        return (
            <div>
                <input type="text" id="search-box" placeholder="search articles here" onKeyUp={this.handleChange} />
                <div>
                    {this.getArticles().map((article) => {
                        <div>Result</div>
                    }) }
                </div>
            </div>
        )
    }
}
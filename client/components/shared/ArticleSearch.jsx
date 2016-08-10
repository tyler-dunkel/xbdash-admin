import React, {Component} from 'react';
import {SearchSource} from 'meteor/meteorhacks:search-source';

let options = {keepHistory: 1000 * 60 * 5, localSearch: true};
let fields = ['articleTitle', 'author'];
SearchArticles = new SearchSource('articles', this.fields, this.options);

export default class ArticleSearch extends Component {
    constructor() {
        super();

        console.log(options);
        console.log(fields);
        console.log(SearchArticles);
    }

    getArticles() {
        let articles = SearchArticles.getData({
            transform(matchText, regExp) {
                return matchText.replace(regExp, "<b>$&</b>")
            },
            sort: { isoScore: -1 }
        });
        console.log(articles);
        return articles;
    }

    isLoading() {
        return SearchArticles.getStatus().loading;
    }

    handleChange(e) {
        console.log(fields);
        console.log(options);
        var text = $(e.target).val().trim();
        console.log(text);
        SearchArticles.search(text);
    }

    render() {
        return (
            <div>
                <input type="text" id="search-box" placeholder="search articles here" onKeyUp={this.handleChange} />
                <div>
                    {this.getArticles().map((article) => {
                        return <div>Result</div>
                    }) }
                </div>
            </div>
        )
    }
}
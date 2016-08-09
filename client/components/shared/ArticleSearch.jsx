import React, {Component} from 'react';

export default class ArticleSearch extends Component {

    constructor() {
        super();
        this.options = {
            keepHistory: 1000 * 60 * 5,
            localSearch: true
        };

        this.fields = ['articleTitle', 'author'];

        this.ArticleSearch = new SearchSource('articles', fields, options);
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



    render() {


        return (
            <div>
                {this.getArticles().map((article) => {
                    return 
                }) }
            </div>
        )
    }
}
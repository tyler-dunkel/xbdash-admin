import React, {Component} from 'react';

export default class ArticleSearchResult extends Component {
    render() {
        return (
            <a href="#!" className="collection-item avatar">
                <i className="material-icons circle green">subject</i>
                <span className="title">{this.props.article.title}</span>
                <p>{this.props.article.author}</p>
                <a href="#!" className="secondary-content"><i className="material-icons">grade</i></a>
            </a>
        )
    }
}
import React, {Component} from 'react';

export default class ArticleSearchResult extends Component {

    updateFeatured(articleId) {
        console.log(articleId);
        Meteor.call('addFeaturedContentServer', 1, "article", this.props.article.articleId, (error, result) => {
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
        return (
            <div className="collection-item avatar">
                <a href="#" onClick={this.updateFeatured(this.props.article._id)}>
                    <i className="material-icons circle green">subject</i>
                    <span className="title">{this.props.article.title}</span>
                    <p>{this.props.article.author}</p>
                    <div className="secondary-content"><i className="material-icons">grade</i></div>
                </a>
            </div>
        )
    }
}
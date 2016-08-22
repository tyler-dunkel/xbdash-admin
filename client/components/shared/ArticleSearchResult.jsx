import React, {Component} from 'react';

export default class ArticleSearchResult extends Component {

    updateFeatured() {
         Meteor.call('addFeaturedContentServer', 1, "article", this.props.article._id, (error, result) => {
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
            <a href="#" onClick={this.updateFeatured} className="collection-item avatar">
                <i className="material-icons circle green">subject</i>
                <span className="title">{this.props.article.title}</span>
                <p>{this.props.article.author}</p>
                <a href="#!" className="secondary-content"><i className="material-icons">grade</i></a>
            </a>
        )
    }
}
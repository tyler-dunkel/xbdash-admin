import React, {Component} from 'react';

export default class ContestSearchResult extends Component {

    updateFeatured(contestId) {
        console.log(contestId);
        Meteor.call('addFeaturedContentServer', 2, "contest", contestId, (error, result) => {
            console.log(error);
            console.log(result);
            if (error) {
                Materialize.toast('You are not authorized to update the featured contest.');
            } else if (result) {
                Materialize.toast(result, 4000);
            }
        })
    }

    render() {
        return (
            <div className="collection-item avatar">
                <a href="#" onClick={this.updateFeatured.bind(this, this.props.contest._id)}>
                    <i className="material-icons circle green">card_giftcard</i>
                    <span className="title">{this.props.contest.title}</span>
                    <p>{this.props.contest.type}</p>
                    <div className="secondary-content"><i className="material-icons">grade</i></div>
                </a>
            </div>
        )
    }
}
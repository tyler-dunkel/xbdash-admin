import React, {Component} from 'react';
import Search from '../shared/Search.jsx';

export default class FeaturedCard extends Component {
    constructor() {
        super();
        this.state = {
            subscription: {
                xbdNews: Meteor.subscribe("allxbdnews"),
                xbdContests: Meteor.subscribe("allxbdcontests"),
                xbdAnnouncements: Meteor.subscribe("allxbdannouncements")
            }
        }
    }

    render() {
        console.log(this.props.type);
        return (
            <div className="card medium">
                <div className="card-image waves-effect waves-block waves-light">
                    <img className="activator" src="images/office.jpg" />
                </div>
                <div className="card-content">
                    <span className="card-title activator grey-text text-darken-4">{this.props.type}<i className="material-icons right">more_vert</i></span>
                    <p><a href="#">This is a link</a></p>
                </div>
                <div className="card-reveal">
                    <span className="card-title grey-text text-darken-4">Update {this.props.type}<i className="material-icons right">close</i></span>
                    <Search type={this.props.type}/>
                </div>
            </div>

        )
    }
}
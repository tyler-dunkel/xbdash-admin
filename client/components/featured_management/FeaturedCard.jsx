import React, {Component} from 'react';
import Search from '../shared/Search.jsx';

export default class FeaturedCard extends Component {
    constructor() {
        super();
        this.state = {
            subscription: {
                xbdNews: Meteor.subscribe("allxbdnews"),
                xbdContests: Meteor.subscribe("allxbdcontests"),
                xbdAnnouncements: Meteor.subscribe("allxbdannouncements"),
                xbdFeaturedContent: Meteor.subscribe("allxbdfeaturedcontent")
            }
        }
    }

    render() {
        console.log(this.props.type);
        if (this.props.type === 'article') {
            return (
                <div className="card medium white z-depth-4">
                    <div className="card-image waves-effect waves-block waves-light">
                    </div>
                    <div className="card-content">
                        <span className="card-title activator green-text">{this.props.type}<i className="material-icons right">more_vert</i></span>
                        <ul>
                            <li>Title: </li>
                            <li>Author: </li>
                        </ul>
                    </div>
                    <div className="card-reveal">
                        <span className="card-title green-text">Update {this.props.type}<i className="material-icons right">close</i></span>
                        <Search type={this.props.type}/>
                    </div>
                </div>
            )
        } else if (this.props.type === 'announcement') {
            return (
                <div className="card medium white z-depth-4">
                    <div className="card-image waves-effect waves-block waves-light">
                        <img className="activator" src="images/office.jpg" />
                    </div>
                    <div className="card-content">
                        <span className="card-title activator green-text">{this.props.type}<i className="material-icons right">more_vert</i></span>
                        <p><a href="#">This is a link</a></p>
                    </div>
                    <div className="card-reveal">
                        <span className="card-title green-text">Update {this.props.type}<i className="material-icons right">close</i></span>
                        <Search type={this.props.type}/>
                    </div>
                </div>
            )
        } else if (this.props.type === 'clip') {
            return (
                <div className="card medium white z-depth-4">
                    <div className="card-image waves-effect waves-block waves-light">
                        <img className="activator" src="images/office.jpg" />
                    </div>
                    <div className="card-content">
                        <span className="card-title activator green-text">{this.props.type}<i className="material-icons right">more_vert</i></span>
                        <p><a href="#">This is a link</a></p>
                    </div>
                    <div className="card-reveal">
                        <span className="card-title green-text">Update {this.props.type}<i className="material-icons right">close</i></span>
                        <Search type={this.props.type}/>
                    </div>
                </div>
            )
        } else if (this.props.type === 'image') {
            return (
                <div className="card medium white z-depth-4">
                    <div className="card-image waves-effect waves-block waves-light">
                        <img className="activator" src="images/office.jpg" />
                    </div>
                    <div className="card-content">
                        <span className="card-title activator green-text">{this.props.type}<i className="material-icons right">more_vert</i></span>
                        <p><a href="#">This is a link</a></p>
                    </div>
                    <div className="card-reveal">
                        <span className="card-title green-text">Update {this.props.type}<i className="material-icons right">close</i></span>
                        <Search type={this.props.type}/>
                    </div>
                </div>
            )
        }

    }
}
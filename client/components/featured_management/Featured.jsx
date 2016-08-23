import React, {Component} from 'react';
import TrackerReact from 'meteor/ultimatejs:tracker-react';
import FeaturedArea from './FeaturedArea.jsx';

export default class Featured extends TrackerReact(Component) {
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

    componentWillUnmount() {
        this.state.subscription.xbdNews.stop();
        this.state.subscription.xbdContests.stop();
        this.state.subscription.xbdAnnouncements.stop();
        this.state.subscription.xbdFeaturedContent.stop();
    }

    render() {
        return (
            <div>
                <FeaturedArea />
            </div>
        );
    }

}
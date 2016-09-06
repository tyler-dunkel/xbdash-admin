import React, {Component} from 'react';
import TrackerReact from 'meteor/ultimatejs:tracker-react';
import AnnouncementSingle from './AnnouncementSingle.jsx';

export default class AnnouncementList extends TrackerReact(Component) {
    constructor() {
        super();
        this.state = {
            subscription: {
                xbdAnnouncements: Meteor.subscribe("allxbdannouncements")
            }
        }
    }

    componentWillUnmount() {
        this.state.subscription.xbdAnnouncements.stop();
    }

    getAllAnnouncements() {
        return xbdAnnouncements.find().fetch();
    }

    render() {
        if (!this.getAllAnnouncements()) {
            <div className="progress">
                <div className="indeterminate"></div>
            </div>
        }
        return (
            <div>
                {this.getAllAnnouncements().map((announcement) => {
                    return <AnnouncementSingle announcement={announcement} />
                }) }
            </div>
        )
    }
}
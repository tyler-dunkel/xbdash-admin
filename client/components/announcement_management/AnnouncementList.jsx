import React from 'react';
import TrackerReact from 'meteor/ultimatejs:tracker-react';
import AnnouncementSingle from './AnnouncementSingle.jsx';

xbdAnnouncements = new Mongo.Collection("xbdannouncements");

export default class AnnouncementList extends TrackerReact(Component) {
    constructor() {
        super();
        this.state = {
            subscription: {
                xbdAnnouncements: Meteor.subscribe("allxbdannouncments")
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
            <div>Loading announcements...</div>
        }
        return (
            <div>
                {this.getAllAnnouncements().map((announcment) => {
                    return <AnnouncementSingle contest={announcment} />
                }) }
            </div>
        )
    }
}
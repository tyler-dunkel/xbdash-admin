import React from 'react';
import TrackerReact from 'meteor/ultimatejs:tracker-react';

export default class AnnouncementDetails extends TrackerReact(Component) {
    constructor(){
        super();
        this.state = {
            subscription: {
                xbdAnnouncements: Meteor.subscribe("allxbdannouncements");
            }
        }
    }

    componentDidMount(){

    }

    componentWillUnmount(){
        this.state.subscription.xbdAnnouncements.stop();
    }

    getAnnouncement(){
        return xbdAnnouncements.findOne(this.props.id);
    }

    addAnnouncement(event){
        event.preventDefault();
        let id = this.props.id;
    }

    render(){
        return(
            <div></div>
        )
    }
}
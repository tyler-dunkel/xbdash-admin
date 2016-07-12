import React, {Component} from 'react';
import TrackerReact from 'meteor/ultimatejs:tracker-react';

export default class AnnouncementDetails extends TrackerReact(Component) {
    constructor() {
        super();
        this.state = {
            subscription: {
                xbdAnnouncements: Meteor.subscribe("allxbdannouncements")
            }
        }
    }

    componentDidMount() {
        console.log("Announcement details component mounted.");
    }

    componentWillUnmount() {
        this.state.subscription.xbdAnnouncements.stop();
    }

    getAnnouncement() {
        return xbdAnnouncements.findOne(this.props.id);
    }

    addAnnouncement(event) {
        event.preventDefault();
        let id = this.props.id;
        let title = this.refs.Title.value.trim();
        let summary = this.refs.Summary.value.trim();
        let image = this.refs.Image.value.trim();
        let link = this.refs.Link.value.trim();

        Meteor.call('addAnnouncementServer', id, title, summary, image, link, () => {
            console.log("Announcement submitted");
            Materialize.toast('Announcement Submitted', 4000);
        })

    }

    render() {
        let announcement = this.getAnnouncement();
        if (!announcement && this.props.id != 'new') {
            return (
                <div>Loading details...</div>
            )
        } if (!announcement && this.props.id == 'new') {
            return (
                <div>
                    <form onSubmit={this.addAnnouncement.bind(this) }>
                        <input type="text" id="Title" ref="Title" placeholder="Title" />
                        <input type="text" id="Summary" ref="Summary" placeholder="Summary" />
                        <input type="text" id="Image" ref="Image" placeholder="Image"/>
                        <input type="text" id="Link" ref="Link" placeholder="Link" />
                        <button type="submit" className="btn waves-effect waves-light">Submit</button>
                    </form>
                </div>
            )
        } else {
            return (
                <div>
                    <form onSubmit={this.addAnnouncement.bind(this) }>
                        <input type="text" id="Title" ref="Title" placeholder={announcement.title} defaultValue={announcement.title} />
                        <input type="text" id="Summary" ref="Summary" placeholder={announcement.summary} defaultValue={announcement.summary} />
                        <input type="text" id="Image" ref="Image" placeholder={announcement.image} defaultValue={announcement.image} />
                        <input type="text" id="Link" ref="Link" placeholder={announcement.image} defaultValue={announcement.image} />
                        <button type="submit" className="btn waves-effect waves-light">Submit</button>
                    </form>
                </div>
            )
        }

    }
}
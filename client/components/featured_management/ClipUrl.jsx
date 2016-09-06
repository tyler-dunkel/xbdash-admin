import React, {Component} from 'react';
import TrackerReact from 'meteor/ultimatejs:tracker-react';

export default class ClipUrl extends TrackerReact(Component) {
    updateFeaturedClip() {
        let clipUrl = $("#clipUrl").val();
        Meteor.call('addFeaturedContentServer', 3, "clip", clipUrl, (error, result) => {
            if (error) {
                Materialize.toast('You are not authorized to update the featured clip.');
            } else if (result) {
                Materialize.toast(result, 4000);
            }
        })
    }

    render() {
        return (
            <div>
                <input placeholder="Enter clip url" id="clipUrl"></input>
                <input type="submit" onClick={this.updateFeaturedClip.bind(this) } className="waves-effect waves-light btn white green-text"/>
            </div>
        )
    }
}
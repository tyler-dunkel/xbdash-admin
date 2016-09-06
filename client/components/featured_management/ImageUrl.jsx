import React, {Component} from 'react';
import TrackerReact from 'meteor/ultimatejs:tracker-react';
import CloudinaryUploadButton from '../shared/CloudinaryUploadButton.jsx';

export default class ImageUrl extends TrackerReact(Component) {
    updateFeaturedImage() {
        let imageUrl = $("#imageUrl").val();
        Meteor.call('addFeaturedContentServer', 4, "image", imageUrl, (error, result) => {
            if (error) {
                Materialize.toast('You are not authorized to update the featured image.');
            } else if (result) {
                Materialize.toast(result, 4000);
            }
        })
    }

    render() {
        return (
            <div>
                <CloudinaryUploadButton />
                <div id="cloudinary_links"></div>
                <input type="text" id="imageUrl" placeholder="Insert image link" />
                <input type="submit" onClick={this.updateFeaturedImage.bind(this) } className="waves-effect waves-light btn white green-text"/>
            </div>
        )
    }
}
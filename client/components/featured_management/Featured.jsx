import React, {Component} from 'react';
import TrackerReact from 'meteor/ultimatejs:tracker-react';
import FeaturedArea from './FeaturedArea.jsx';

export default class Featured extends TrackerReact(Component) {
    render() {
        return (
            <div>
                <FeaturedArea />
            </div>
        );
    }

}
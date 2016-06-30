import React,{Component} from 'react';
import TrackerReact from 'meteor/ultimatejs:tracker-react';

export default class ContestDetails extends TrackerReact(Component) {
    constructor() {
        super();
        this.state = {
            subscription: {
                xbdContests: Meteor.subscribe("allxbdcontests")
            }
        }
    }



            )
        }
        else {
            return (
                <div>Hi</div>
            )
        }

    }
}

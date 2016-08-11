import React, {Component} from 'react';

export default class UserWidget extends Component {

    constructor() {
        super();
        this.state = {
            subscription: {
                numberOfUsers: Meteor.subscribe('userCount'),
                numberOfUsersToday: Meteor.subscribe('userCountToday')
            }
        };
    }

    getUserCount(when) {
        if (when === 'all') {
            return Counts.get('user-count');
        } else if (when === 'today') {
            return Counts.get('user-count-today');
        }
    }
    render() {
        let totalUserCount = this.getUserCount('all');
        let todaysUserCount = this.getUserCount('today');

        return (
            <div className="row">
                <div className="col s4">
                    <div className="card-panel white">
                        <span className="green-text flow-text">
                        <div className="center">
                            <i className="medium material-icons">perm_identity</i>
                            <br/>
                            Total: {totalUserCount}
                            <br/>
                            Today: {todaysUserCount}
                            </div>
                        </span>
                    </div>
                </div>
            </div>
        )
    }
}
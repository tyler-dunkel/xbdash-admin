import React, {Component} from 'react';

export default class UserWidget extends Component {

    constructor() {
        super();
        this.state = {

        };
    }
    render() {
        return (
            <div className="row">
                <div className="col s6 m3">
                    <div className="card-panel white">
                        <span className="green-text flow-text">
                        <div className="center">
                            <i className="medium material-icons">perm_identity</i>
                            <br/>
                            Users
                            <br/>
                            Total: {this.props.totalUserCount}
                            <br/>
                            Joined today: {this.props.todaysUserCount}
                            </div>
                        </span>
                    </div>
                </div>
            </div>
        )
    }
}
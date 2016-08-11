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
                <div className="col s4">
                    <div className="card-panel white">
                        <span className="green-text flow-text">
                        <div className="center">
                            <i className="medium material-icons">perm_identity</i>
                            <br/>
                            Users
                            <br/>
                            Total: {this.props.totalUserCount}
                            <br/>
                            Today: {this.props.todaysUserCount}
                            </div>
                        </span>
                    </div>
                </div>
            </div>
        )
    }
}
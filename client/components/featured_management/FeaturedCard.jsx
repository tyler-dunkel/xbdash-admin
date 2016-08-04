import React, {Component} from 'react';

export default class FeaturedCard extends Component {
    render() {
        console.log(this.props.type);
        return (
            <div className="card sticky-action">

                <div className="card-action"></div>

                <div className="card-reveal"></div>
            </div>
        )
    }
}
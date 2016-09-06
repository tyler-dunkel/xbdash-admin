import React, {Component} from 'react';
import FeaturedCard from './FeaturedCard.jsx';

export default class FeaturedArea extends Component {
    render() {
        return (
            <div>
                <div className="row">
                    <div className="col s6"><FeaturedCard type="article"/></div>
                    <div className="col s6"><FeaturedCard type="contest"/></div>
                </div>
                <div className="row">
                    <div className="col s6"><FeaturedCard type="clip"/></div>
                    <div className="col s6"><FeaturedCard type="image"/></div>
                </div>
            </div>
        )
    }
}
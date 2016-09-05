import React, {Component} from 'react';
import ArticleSearch from './ArticleSearch.jsx';
import ContestSearch from './ContestSearch.jsx';
import ClipUrl from './ClipUrl.jsx';
import ImageUrl from './ImageUrl.jsx';

export default class FeaturedCard extends Component {
    render() {
        if (this.props.type === 'article') {
            return (
                <div className="card medium white z-depth-4">
                    <div className="card-image waves-effect waves-block waves-light">
                    </div>
                    <div className="card-content">
                        <span className="card-title activator green-text">{this.props.type}<i className="material-icons right">more_vert</i></span>
                        <ul>
                            <li>Article Title: </li>
                            <li>Author: </li>
                        </ul>
                    </div>
                    <div className="card-reveal">
                        <span className="card-title green-text">Update {this.props.type}<i className="material-icons right">close</i></span>
                        <ArticleSearch />
                    </div>
                </div>
            )
        } else if (this.props.type === 'contest') {
            return (
                <div className="card medium white z-depth-4">
                    <div className="card-image waves-effect waves-block waves-light">
                    </div>
                    <div className="card-content">
                        <span className="card-title activator green-text">{this.props.type}<i className="material-icons right">more_vert</i></span>
                        <ul>
                            <li>Contest Title: </li>
                            <li>Type: </li>
                        </ul>
                    </div>
                    <div className="card-reveal">
                        <span className="card-title green-text">Update {this.props.type}<i className="material-icons right">close</i></span>
                        <ContestSearch />
                    </div>
                </div>
            )
        } else if (this.props.type === 'clip') {
            return (
                <div className="card medium white z-depth-4">
                    <div className="card-image waves-effect waves-block waves-light">
                    </div>
                    <div className="card-content">
                        <span className="card-title activator green-text">{this.props.type}<i className="material-icons right">more_vert</i></span>
                        <ul>
                            <li>Clip link: </li>
                        </ul>
                    </div>
                    <div className="card-reveal">
                        <span className="card-title green-text">Update {this.props.type}<i className="material-icons right">close</i></span>
                        <ClipUrl />
                    </div>
                </div>
            )
        } else if (this.props.type === 'image') {
            return (
                <div className="card medium white z-depth-4">
                    <div className="card-image waves-effect waves-block waves-light">
                    </div>
                    <div className="card-content">
                        <span className="card-title activator green-text">{this.props.type}<i className="material-icons right">more_vert</i></span>
                        <ul>
                            <li><img src="" /></li>
                        </ul>
                    </div>
                    <div className="card-reveal">
                        <span className="card-title green-text">Update {this.props.type}<i className="material-icons right">close</i></span>
                        <ImageUrl />
                    </div>
                </div>
            )
        }

    }
}
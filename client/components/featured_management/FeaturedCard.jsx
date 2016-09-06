import React, {Component} from 'react';
import TrackerReact from 'meteor/ultimatejs:tracker-react';
import ArticleSearch from './ArticleSearch.jsx';
import ContestSearch from './ContestSearch.jsx';
import ClipUrl from './ClipUrl.jsx';
import ImageUrl from './ImageUrl.jsx';

export default class FeaturedCard extends TrackerReact(Component) {
    constructor() {
        super();
        this.state = {
            articleData: null,
            contestData: null,
            clipData: null,
            imageData: null,
            clipId: null,
        };
    }

    componentDidMount() {
        this.getFeaturedArticle();
        this.getFeaturedContest();
        this.getFeaturedClip();
        this.getFeaturedImage();
    }

    getFeaturedArticle() {
        Meteor.call('getFeaturedArticle', (error, result) => {
            article = result[0];
            this.setState({
                articleData: article,
            });
        });
    }

    getFeaturedContest() {
        Meteor.call('getFeaturedContest', (error, result) => {
            let contest = result[0];
            this.setState({
                contestData: contest,
            });
        });
    }

    getFeaturedClip() {
        Meteor.call('getFeaturedClip', (error, result) => {
            let clip = result;
            let video_id = clip.split('v=')[1];
            let ampersandPosition = video_id.indexOf('&');
            if (ampersandPosition != -1) {
                video_id = video_id.substring(0, ampersandPosition);
            }
            let clipSrc = "https://www.youtube.com/embed/" + video_id + "?autoplay=0&origin=http://xbdash.com";
            this.setState({
                clipData: clip,
                clipId: clipSrc,
            });
        });
    }

    getFeaturedImage() {
        Meteor.call('getFeaturedImage', (error, result) => {
            let image = result;
            this.setState({
                imageData: image,
            });
        });
    }

    render() {
        if (this.props.type === 'article' && this.state.articleData == null) {
            return (
                <div className="card medium white z-depth-4">
                    <div className="card-image waves-effect waves-block waves-light">
                    </div>
                    <div className="card-content">
                        <span className="card-title activator green-text">{this.props.type}<i className="material-icons right">more_vert</i></span>
                        <div className="progress">
                            <div className="indeterminate"></div>
                        </div>
                    </div>
                    <div className="card-reveal">
                        <span className="card-title green-text">Update {this.props.type}<i className="material-icons right">close</i></span>
                        <ArticleSearch />
                    </div>
                </div>
            )
        } else if (this.props.type === 'article' && this.state.articleData != null) {
            return (
                <div className="card medium white z-depth-4">
                    <div className="card-image waves-effect waves-block waves-light">
                    </div>
                    <div className="card-content">
                        <span className="card-title activator green-text">{this.props.type}<i className="material-icons right">more_vert</i></span>
                        <ul className="collection">
                            <li className="collection-item avatar">
                                <i className="material-icons circle green">subject</i>
                                <span className="title">{this.state.articleData.title}</span>
                                <p>{this.state.articleData.author}</p>
                                <a href="#!" className="secondary-content"><i className="material-icons">grade</i></a>
                            </li>
                        </ul>
                    </div>
                    <div className="card-reveal">
                        <span className="card-title green-text">Update {this.props.type}<i className="material-icons right">close</i></span>
                        <ArticleSearch />
                    </div>
                </div>
            )
        } else if (this.props.type === 'contest' && this.state.contestData == null) {
            return (
                <div className="card medium white z-depth-4">
                    <div className="card-image waves-effect waves-block waves-light">
                    </div>
                    <div className="card-content">
                        <span className="card-title activator green-text">{this.props.type}<i className="material-icons right">more_vert</i></span>
                        <div className="progress">
                            <div className="indeterminate"></div>
                        </div>
                    </div>
                    <div className="card-reveal">
                        <span className="card-title green-text">Update {this.props.type}<i className="material-icons right">close</i></span>
                        <ContestSearch />
                    </div>
                </div>
            )
        } else if (this.props.type === 'contest' && this.state.contestData != null) {
            return (
                <div className="card medium white z-depth-4">
                    <div className="card-image waves-effect waves-block waves-light">
                    </div>
                    <div className="card-content">
                        <span className="card-title activator green-text">{this.props.type}<i className="material-icons right">more_vert</i></span>
                        <ul className="collection">
                            <li className="collection-item avatar">
                                <i className="material-icons circle green">subject</i>
                                <span className="title">{this.state.contestData.title}</span>
                                <p>{this.state.contestData.status}</p>
                                <a href="#!" className="secondary-content"><i className="material-icons">grade</i></a>
                            </li>
                        </ul>
                    </div>
                    <div className="card-reveal">
                        <span className="card-title green-text">Update {this.props.type}<i className="material-icons right">close</i></span>
                        <ContestSearch />
                    </div>
                </div>
            )
        } else if (this.props.type === 'clip' && this.state.clipId == null) {
            return (
                <div className="card medium white z-depth-4">
                    <div className="card-image waves-effect waves-block waves-light">
                    </div>
                    <div className="card-content">
                        <span className="card-title activator green-text">{this.props.type}<i className="material-icons right">more_vert</i></span>
                        <div className="progress">
                            <div className="indeterminate"></div>
                        </div>
                    </div>
                    <div className="card-reveal">
                        <span className="card-title green-text">Update {this.props.type}<i className="material-icons right">close</i></span>
                        <ClipUrl />
                    </div>
                </div>
            )
        } else if (this.props.type === 'clip' && this.state.clipId != null) {
            return (
                <div className="card medium white z-depth-4">
                    <div className="card-content">
                        <span className="card-title activator green-text">{this.props.type}<i className="material-icons right">more_vert</i></span>
                    </div>
                    <center><iframe id="ytplayer" type="text/html" width="425" height="300"
                        src={this.state.clipId}
                        frameborder="0"></iframe></center>
                    <div className="card-reveal">
                        <span className="card-title green-text">Update {this.props.type}<i className="material-icons right">close</i></span>
                        <ClipUrl />
                    </div>
                </div>
            )
        } else if (this.props.type === 'image' && this.state.imageData == null) {
            return (
                <div className="card medium white z-depth-4">
                    <div className="card-image waves-effect waves-block waves-light">
                    </div>
                    <div className="card-content">
                        <span className="card-title activator green-text">{this.props.type}<i className="material-icons right">more_vert</i></span>
                        <div className="progress">
                            <div className="indeterminate"></div>
                        </div>
                    </div>
                    <div className="card-reveal">
                        <span className="card-title green-text">Update {this.props.type}<i className="material-icons right">close</i></span>
                        <ImageUrl />
                    </div>
                </div>
            )
        } else if (this.props.type === 'image' && this.state.imageData != null) {
            return (
                <div className="card medium white z-depth-4">
                    <div className="card-content">
                        <span className="card-title activator green-text">{this.props.type}<i className="material-icons right">more_vert</i></span>
                    </div>
                    <center><img src={this.state.imageData} width="425" height="300"/></center>
                    <div className="card-reveal">
                        <span className="card-title green-text">Update {this.props.type}<i className="material-icons right">close</i></span>
                        <ImageUrl />
                    </div>
                </div>
            )
        }
    }
}
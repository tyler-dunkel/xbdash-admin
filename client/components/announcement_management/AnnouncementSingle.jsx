import React,{Component} from 'react';

export default class AnnouncementSingle extends Component{

  getRouteUrl(){
    return "/announcementtool/"+this.props.announcement._id;
  }

  render() {
    return (
      <div classNameName="row">
        <div className="col s12 m6">
          <div className="card green darken-1 z-depth-4">
            <div className="card-content white-text">
              <span className="card-title">{this.props.announcement.title}</span>
            </div>
            <div className="card-action">
              <a href={this.getRouteUrl()}>Edit</a>
              <a href="#">Delete</a>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

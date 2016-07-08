import React,{Component} from 'react';

export default class AnnouncementSingle extends Component{

  getRouteUrl(){
    return "/announcementtool/"+this.props.announcement._id;
  }

  render() {
    return (
      <div classNameName="row">
        <div className="col s12 m6">
          <div className="card blue-grey darken-1">
            <div className="card-content white-text">
              <span className="card-title">Announcement title</span>
              <ul>
                <li>Announcement Information Here</li>>
              </ul>
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

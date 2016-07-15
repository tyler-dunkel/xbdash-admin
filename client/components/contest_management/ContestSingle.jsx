import React,{Component} from 'react';

export default class ContestSingle extends Component{

  getRouteUrl(){
    return "/contesttool/"+this.props.contest._id;
  }

  render() {
    return (
      <div className="row">
        <div className="col s12 m6">
          <div className="card blue-grey darken-1">
            <div className="card-content white-text">
              <span className="card-title">Contest title</span>
              <ul>
                <li>{this.props.contest.status}</li>
                <li>{this.props.contest.contestToken}</li>
                <li>{this.props.contest.entries.length}</li>
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

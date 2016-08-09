import React,{Component} from 'react';

export default class ContestSingle extends Component{

  getRouteUrl(){
    return "/contesttool/"+this.props.contest._id;
  }

  render() {
    // console.log(this.props.contest);
    // if(this.props.contest.entries='undefined'){
    //   let entryCount = "Entries are undefined";
    // } else {
    //   let entryCount = this.props.contest.entries.length;
    // }
    return (
      <div className="row">
        <div className="col s12 m6">
          <div className="card green darken-1 z-depth-4">
            <div className="card-content white-text">
              <span className="card-title">Contest {this.props.contest._id}</span>
              <ul>
                <li>{this.props.contest.status}</li>
                <li>{this.props.contest.contestToken}</li>
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

import React,{Component} from 'react';
import { Meteor } from 'meteor/meteor';

export default class Home extends Component {
  render(){
    console.log(Meteor.user());
    return (
      <div>
        <div className="section no-pad-bot" id="index-banner">
          <div className="container">
            <h1 className="header center green-text">Hello, username</h1>
            <div className="row center">
            
            </div>
          </div>
        </div>
      </div>
    )
  }
}

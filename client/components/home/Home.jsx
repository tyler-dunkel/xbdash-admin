import React, {Component} from 'react';
import TrackerReact from 'meteor/ultimatejs:tracker-react';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';

export default class Home extends TrackerReact(Component) {
  render() {

    if (!Meteor.user()) {
      return (
        <div>
          <div className="section no-pad-bot" id="index-banner">
            <div className="container">
              <h1 className="header center green-text">Please sign in.</h1>
              <div className="row center">
              </div>
            </div>
          </div>
        </div>
      )
    } 
    
    let allowed = Meteor.call('isUserAllowed', Meteor.user().emails[0].address, (error, result) => {
      console.log(result);
      return result;
    });

    if(allowed === undefined){
      render(
        <div>
          <div className="section no-pad-bot" id="index-banner">
            <div className="container">
              <h1 className="header center green-text">Checking account security clearance.</h1>
              <div className="row center">
              </div>
            </div>
          </div>
        </div>
      )
    }
    
    console.log(allowed + "should be second");
     if (allowed === false) {
      return (
        <div>
          <div className="section no-pad-bot" id="index-banner">
            <div className="container">
              <h1 className="header center green-text">Unauthorized user. Please login with an authorized account.</h1>
              <div className="row center">
              </div>
            </div>
          </div>
        </div>
      )
    }
    Meteor.user().emails[0].address
    let username = Meteor.user().username;
    return (
      <div>
        <div className="section no-pad-bot" id="index-banner">
          <div className="container">
            <h1 className="header center green-text">Hello, {username}</h1>
            <div className="row center">
            </div>
          </div>
        </div>
      </div>
    )
  }
}

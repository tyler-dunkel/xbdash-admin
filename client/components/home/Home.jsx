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

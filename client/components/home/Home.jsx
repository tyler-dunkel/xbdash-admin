import React, {Component} from 'react';
import TrackerReact from 'meteor/ultimatejs:tracker-react';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';
import { ReactiveVar } from 'meteor/reactive-var'
import UserWidget from './UserWidget.jsx';

export default class Home extends TrackerReact(Component) {

  constructor() {
    super();
    this.state = {
      allowed: false
    };
  }

  toggleUserAccess() {
    this.setState({
      allowed: !this.state.allowed,
    });
  }

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

    if (Meteor.loggingIn()) {
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


    let shouldAllow = Meteor.call('isUserAllowed', Meteor.user().emails[0].address, (error, result) => {
      console.log(result);
      if (result === true) {
        toggleUserAccess();
      }
      return result;
    });


    if (this.state.allowed == null) {
      return (
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

    let username = Meteor.user().username;
    return (
      <div>
        <div className="row">
          <div className="section no-pad-bot" id="index-banner">
            <div className="container">
              <h1 className="header center green-text">Hello, {username}</h1>
              <div className="row center">
              </div>
            </div>
          </div>
        </div>
        <div className="row">
          <UserWidget />
        </div>
      </div>
    )
  }
}

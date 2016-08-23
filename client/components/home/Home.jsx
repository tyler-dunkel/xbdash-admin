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
      allowed: false,
      subscription: {
        numberOfUsers: Meteor.subscribe('userCount'),
        numberOfUsersToday: Meteor.subscribe('userCountToday'),
        numberofUsersActiveToday: Meteor.subscribe('usersActiveToday')
      }
    };
  }

  toggleUserAccess() {
    this.setState({
      allowed: !this.state.allowed,
    });
  }
  getUserCount(when) {
    if (when === 'all') {
      return Counts.get('user-count');
    } else if (when === 'today') {
      return Counts.get('user-count-today');
    } else if (when === 'activeToday') {
      return Counts.get('users-active-today');
    }
  }
  render() {
    let totalUserCount = this.getUserCount('all');
    let todaysUserCount = this.getUserCount('today');
    let todaysActiveUsers = this.getUserCount('activeToday');

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
          <UserWidget totalUserCount={this.getUserCount("all") } usersJoinedToday={this.getUserCount("today") } usersActiveToday={this.getUserCount("activeToday") } />
        </div>
      </div>
    )
  }
}

import React, {Component} from 'react';
import TrackerReact from 'meteor/ultimatejs:tracker-react';

import ContestSingle from './ContestSingle.jsx';

xbdContests = new Mongo.Collection("xbdcontests");

export default class ContestList extends TrackerReact(Component) {

  constructor() {
    super();
    this.state = {
      subscription: {
        xbdContests: Meteor.subscribe("allxbdcontests")
      }
    }
  }

  componentWillUnmount() {
    this.state.subscription.xbdContests.stop();
  }

  getAllContests() {
    return xbdContests.find().fetch();
  }

  render() {
    if (!this.getAllContests()) {
      console.log("Loading Contests...");
      return (
        <div>Loading...</div>
      )
    }
    return (
      <div>
        {this.getAllContests().map((contest) => {
          return <ContestSingle contest={contest} />
        }) }
      </div>
    )
  }
}

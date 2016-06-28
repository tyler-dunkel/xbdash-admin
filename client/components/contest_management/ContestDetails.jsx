import React,{Component} from 'react';
import TrackerReact from 'meteor/ultimatejs:tracker-react';

export default class ContestDetails extends TrackerReact(Component) {
  constructor() {
    super();
    this.state = {
      subscription: {
        xbdContests: Meteor.subscribe("allxbdcontests")
      }
    }
  }

  componentDidMount() {
    console.log("Contest details component mounted");
  }

  componentWillUnmount() {
    this.state.subscription.xbdContests.stop();
  }

  getContest() {
    return xbdContests.findOne(this.props.id);
  }

  render() {
    let contest = this.getContest();
    if(this.props.id==='new'){
      return(
        <div>
          <input type="text" id="Status" placeholder="Status" />
          <input type="text" id="contestToken" placeholder="Contest Token" />
          <input type="datetime" id="StartDate" />
          <input type="datetime" id="EndDate" />
          <input type="datetime" id="SendPrizeDate" />
        </div>
      )
    }
    else{
      return(
        <div>
          <input type="text" id="Status" placeholder={contest.status} />
          <input type="text" id="ContestToken" placeholder={contest.token} />
          <input type="datetime" id="StartDate" />
          <input type="datetime" id="EndDate" />
          <input type="datetime" id="SendPrizeDate" />
        </div>
      )
    }

  }
}

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
    $('select').material_select();
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
        <form>
          <div>
            <div className="input-field">
              <input type="text" id="Title" className="validate" />
              <label for="Title">Title</label>
            </div>
            <div className="input-field">
              <select id="Status">
                <option value="Active" selected>Active</option>
                <option value="Disabled">Disabled</option>
              </select>
              <label for="Status">Status</label>
            </div>
            <div className="input-field">
              <input type="text" id="ContestToken" className="validate" />
              <label for="ContestToken">Contest Token</label>
            </div>
            <div>
              <label for="StartDate">Start Date</label>
              <input type="datetime-local" id="StartDate" />
            </div>
            <div>
              <label for="StartDate">End Date</label>
              <input type="datetime-local" id="EndDate" />
            </div>
            <div>
              <label for="SendPrizeDate">Send Prize Date</label>
              <input type="datetime-local" id="SendPrizeDate" />
            </div>
          </div>
          <button type="submit" className="btn waves-effect waves-light">Submit</button>
        </form>
      )
    }
    else{
      return(
        <form>
          <div>
            <input type="text" id="Title" placeholder="Title" />
            <select id="Status">
              <option value="Active" selected>Active</option>
              <option value="Disabled">Disabled</option>
            </select>
            <input type="text" id="contestToken" placeholder="Contest Token" />
            <input type="datetime" id="StartDate" />
            <input type="datetime" id="EndDate" />
            <input type="datetime" id="SendPrizeDate" />
          </div>
        </form>
      )
    }

  }
}

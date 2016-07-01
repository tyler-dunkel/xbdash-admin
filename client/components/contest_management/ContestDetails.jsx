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


        $(document).ready(function () {
            $("#add-row").click(function () {
                var $clone = $("#prizeArea").first().clone();
                $clone.append("<button type=\"button\" id=\"remove-row\" class=\"btn-floating btn-large waves-effect waves-light red\"><i class=\"material-icons\">delete</i></button><br/>");
                $clone.insertBefore("#add-row");
            });

            $(document).on("click", "#remove-row", function () {
                $(this).closest("#prizeArea").remove();
            });
        });
    }

    componentWillUnmount() {
        this.state.subscription.xbdContests.stop();
    }

    getPrizesFormat() {
        //Method to format prizes into an array for the server method.
    }

    getRulesFormat() {
        //Method to format rules into an array for the server method.
    }

    addContest(event) {
        event.preventDefault();
        let id = this.props.id;
        let status = this.refs.Status.value.trim();
        let contestToken = this.refs.ContestToken.value.trim();
        let startDate = this.refs.StartDate.value.trim();
        let endDate = this.refs.EndDate.value.trim();
        let sendDate = this.refs.SendDate.value.trim();
        let prizes = this.refs.Prizes.value.trim();
        let rules = this.refs.Rules.value.trim();

        Meteor.call('addContestServer', id, status, contestToken, startDate, endDate, sendDate, prizes, rules, ()=>{
            console.log("Contest submitted");
            Materialize.toast('Contest submitted', 4000);
        })
    }

    getContest() {
        return xbdContests.findOne(this.props.id);
    }

    render() {
        let contest = this.getContest();
        if (this.props.id === 'new') {
            return (
                <form>
                    <div>
                        <div>
                            <label for="Title">Title</label>
                            <input type="text" id="Title" className="validate"/>
                        </div>
                        <div>
                            <label for="ContestToken">Contest Token</label>
                            <input type="text" id="ContestToken" className="validate"/>
                        </div>
                        <div>
                            <label for="StartDate">Start Date</label>
                            <input type="datetime-local" id="StartDate"/>
                        </div>
                        <div>
                            <label for="StartDate">End Date</label>
                            <input type="datetime-local" id="EndDate"/>
                        </div>
                        <div>
                            <label for="SendPrizeDate">Send Prize Date</label>
                            <input type="datetime-local" id="SendPrizeDate"/>
                        </div>
                    </div>
                    <div>
                        <select id="Status">
                            <option value="Active" selected>Active</option>
                            <option value="Disabled">Disabled</option>
                        </select>
                        <label for="Status">Status</label>
                    </div>
                    <h5>Prizes</h5>
                    <hr />
                    <div id="prizeArea">
                        <input type="text" id="PrizeTitle" placeholder="Prize Title"/>
                        <select id="IsPremium">
                            <option value="true" selected>true</option>
                            <option value="false">false</option>
                        </select>
                        <input type="text" id="PrizeImageUrl" placeholder="Prize Image Url"/>
                    </div>
                    <button type="button" id="add-row" className="btn-floating btn-large waves-effect waves-light green"><i className="material-icons">add</i></button>
                    <br/><br/>
                    <button type="submit" className="btn waves-effect waves-light">Submit</button>
                </form>

            )
        }
        else {
            return (
                <div>Hi</div>
            )
        }

    }
}

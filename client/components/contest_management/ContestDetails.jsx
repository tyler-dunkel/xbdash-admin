import React, {Component} from 'react';
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

    getPrizesFormat(prizeArray) {
        console.log("The prizeArray is logged below this line:");
        console.log(prizeArray);
        console.log(prizeArray[0]);
        var prizesFormatted = [];
        console.log("The prizeArray length is " + prizeArray.length);
        for (var i = 0; i < prizeArray.length; i++) {
            var prize = prizeArray[i];
            console.log("var i is " + i);
            console.log(prize[i]);
            if (prize[0] != "") {
                prizesFormatted[prizesFormatted.length] = { "title": prize[0], "isPremium": prize[1], "prizeImgUrl": prize[2] };
            }
        }
        console.log(prizesFormatted);
        return prizesFormatted;
    }

    getRulesFormat(ruleArray) {
        var rulesFormatted = [];
        console.log(ruleArray);
        for (var i = 0; i < ruleArray.length; i++) {
            if (ruleArray[i] != "") {
                rulesFormatted[rulesFormatted.length] = { "rule": ruleArray[i] };
            }
        }
        return rulesFormatted;
    }

    addContest(event) {
        event.preventDefault();
        let id = this.props.id;
        let title = this.refs.Title.value.trim();
        let contestToken = this.refs.ContestToken.value.trim();
        let startDate = this.refs.StartDate.value.trim();
        let endDate = this.refs.EndDate.value.trim();
        let sendPrizeDate = this.refs.SendPrizeDate.value.trim();
        let status = this.refs.Status.value.trim();
        let prizes = this.getPrizesFormat([
            [this.refs.PrizeTitle1.value.trim(), $("#IsPremium1").val(), this.refs.PrizeImageUrl1.value.trim()],
            [this.refs.PrizeTitle2.value.trim(), $("#IsPremium2").val(), this.refs.PrizeImageUrl2.value.trim()],
            [this.refs.PrizeTitle3.value.trim(), $("#IsPremium3").val(), this.refs.PrizeImageUrl3.value.trim()],
            [this.refs.PrizeTitle4.value.trim(), $("#IsPremium4").val(), this.refs.PrizeImageUrl4.value.trim()],
            [this.refs.PrizeTitle5.value.trim(), $("#IsPremium5").val(), this.refs.PrizeImageUrl5.value.trim()]
        ]);
        let rules = this.getRulesFormat([
            this.refs.Rule1.value.trim(),
            this.refs.Rule2.value.trim(),
            this.refs.Rule3.value.trim(),
            this.refs.Rule4.value.trim(),
            this.refs.Rule5.value.trim()
        ]);
        Meteor.call('addContestServer', id, status, contestToken, startDate, endDate, sendPrizeDate, prizes, rules, (error, result) => {
            console.log(error);
            console.log(result);
            if (error) {
                Materialize.toast('You are not authorized to submit a contest.');
            } else if (result) {
                Materialize.toast(result, 4000);
            }
        })
    }

    getContest() {
        return xbdContests.findOne(this.props.id);
    }

    render() {
        let contest = this.getContest();
        if (this.props.id === 'new') {
            return (
                <form onSubmit={this.addContest.bind(this) }>
                    <div>
                        <div>
                            <label for="Title">Title</label>
                            <input type="text" id="Title" ref="Title" className="validate"/>
                        </div>
                        <div>
                            <label for="ContestToken">Contest Token</label>
                            <input type="text" id="ContestToken" ref="ContestToken" className="validate"/>
                        </div>
                        <div>
                            <label for="StartDate">Start Date</label>
                            <input type="datetime-local" id="StartDate" ref="StartDate"/>
                        </div>
                        <div>
                            <label for="StartDate">End Date</label>
                            <input type="datetime-local" id="EndDate" ref="EndDate"/>
                        </div>
                        <div>
                            <label for="SendPrizeDate">Send Prize Date</label>
                            <input type="datetime-local" id="SendPrizeDate" ref="SendPrizeDate"/>
                        </div>
                    </div>
                    <div>
                        <select id="Status" ref="Status" defaultValue="Active">
                            <option value="Active">Active</option>
                            <option value="Disabled">Disabled</option>
                        </select>
                        <label for="Status">Status</label>
                    </div>
                    <hr />
                    <h5>Prizes</h5>
                    <hr />
                    <div id="prizeArea1">
                        <input type="text" id="PrizeTitle1" ref="PrizeTitle1" placeholder="Prize Title"/>
                        <select id="IsPremium1" ref="IsPremium1" defaultValue="true">
                            <option value="true" ref="true">true</option>
                            <option value="false" ref="false">false</option>
                        </select>
                        <input type="text" id="PrizeImageUrl1" ref="PrizeImageUrl1" placeholder="Prize Image Url"/>
                    </div>
                    <div id="prizeArea2">
                        <input type="text" id="PrizeTitle2" ref="PrizeTitle2" placeholder="Prize Title"/>
                        <select id="IsPremium2" ref="IsPremium2" defaultValue="true">
                            <option value="true" ref="true">true</option>
                            <option value="false" ref="false">false</option>
                        </select>
                        <input type="text" id="PrizeImageUrl2" ref="PrizeImageUrl2" placeholder="Prize Image Url"/>
                    </div>
                    <div id="prizeArea3">
                        <input type="text" id="PrizeTitle3" ref="PrizeTitle3" placeholder="Prize Title"/>
                        <select id="IsPremium3" ref="IsPremium3" defaultValue="true">
                            <option value="true" ref="true">true</option>
                            <option value="false" ref="false">false</option>
                        </select>
                        <input type="text" id="PrizeImageUrl3" ref="PrizeImageUrl3" placeholder="Prize Image Url"/>
                    </div>
                    <div id="prizeArea4">
                        <input type="text" id="PrizeTitle4" ref="PrizeTitle4" placeholder="Prize Title"/>
                        <select id="IsPremium4" ref="IsPremium4" defaultValue="true">
                            <option value="true" ref="true">true</option>
                            <option value="false" ref="false">false</option>
                        </select>
                        <input type="text" id="PrizeImageUrl4" ref="PrizeImageUrl4" placeholder="Prize Image Url"/>
                    </div>
                    <div id="prizeArea5">
                        <input type="text" id="PrizeTitle5" ref="PrizeTitle5" placeholder="Prize Title"/>
                        <select id="IsPremium5" defaultValue="true">
                            <option value="true" ref="true">true</option>
                            <option value="false" ref="false">false</option>
                        </select>
                        <input type="text" id="PrizeImageUrl5" ref="PrizeImageUrl5" placeholder="Prize Image Url"/>
                    </div>
                    <hr />
                    <h5>Rules</h5>
                    <hr />
                    <div id="ruleArea1">
                        <input type="text" id="Rule1" ref="Rule1" placeholder="Rule"/>
                        <input type="text" id="Rule2" ref="Rule2" placeholder="Rule"/>
                        <input type="text" id="Rule3" ref="Rule3" placeholder="Rule"/>
                        <input type="text" id="Rule4" ref="Rule4" placeholder="Rule"/>
                        <input type="text" id="Rule5" ref="Rule5" placeholder="Rule"/>
                    </div>
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

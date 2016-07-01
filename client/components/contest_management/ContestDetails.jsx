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

    getPrizesFormat(PrizeTitle1, IsPremium1, PrizeImgUrl1, PrizeTitle2, IsPremium2, PrizeImgUrl2, PrizeTitle3, IsPremium3, PrizeImgUrl3, PrizeTitle4, IsPremium4, PrizeImgUrl4, PrizeTitle5, IsPremium5, PrizeImgUrl5) {
        let prizes = [];
        for (var i = 0; i < 5; i++) {
            if (PrizeTitle){

            }
        }
    }

    getRulesFormat() {
        //Method to format rules into an array for the server method.
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
        let prizeArray = []
        let prizes = getPrizesFormat([
            [this.refs.PrizeTitle1.value.trim(), this.refs.IsPremium1.value.trim(), this.refs.PrizeImgUrl1.value.trim()],
            [this.refs.PrizeTitle2.value.trim(), this.refs.IsPremium2.value.trim(), this.refs.PrizeImgUrl2.value.trim()],
            [this.refs.PrizeTitle3.value.trim(), this.refs.IsPremium3.value.trim(), this.refs.PrizeImgUrl3.value.trim()],
            [this.refs.PrizeTitle4.value.trim(), this.refs.IsPremium4.value.trim(), this.refs.PrizeImgUrl4.value.trim()],
            [this.refs.PrizeTitle5.value.trim(), this.refs.IsPremium5.value.trim(), this.refs.PrizeImgUrl5.value.trim()]]
        );
        let rules = getRulesFormat();
        //Meteor.call('addContestServer', id, status, contestToken, startDate, endDate, sendDate, prizes, rules, ()=>{
        //    console.log("Contest submitted");
        //    Materialize.toast('Contest submitted', 4000);
        //})
    }

    getContest() {
        return xbdContests.findOne(this.props.id);
    }

    render() {
        let contest = this.getContest();
        if (this.props.id === 'new') {
            return (
                <form onSubmit={this.addContest.bind(this)}>
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
                        <select id="Status" ref="Status">
                            <option value="Active" selected>Active</option>
                            <option value="Disabled">Disabled</option>
                        </select>
                        <label for="Status">Status</label>
                    </div>
                    <hr />
                    <h5>Prizes</h5>
                    <hr />
                    <div id="prizeArea1">
                        <input type="text" id="PrizeTitle1" ref="PrizeTitle1" placeholder="Prize Title"/>
                        <select id="IsPremium1" ref="IsPremium1">
                            <option value="true" selected>true</option>
                            <option value="false">false</option>
                        </select>
                        <input type="text" id="PrizeImageUrl1" ref="PrizeImageUrl1" placeholder="Prize Image Url"/>
                    </div>
                    <div id="prizeArea2">
                        <input type="text" id="PrizeTitle2" ref="PrizeTitle2" placeholder="Prize Title"/>
                        <select id="IsPremium2" ref="IsPremium2">
                            <option value="true" selected>true</option>
                            <option value="false">false</option>
                        </select>
                        <input type="text" id="PrizeImageUrl2" ref="PrizeImageUrl2" placeholder="Prize Image Url"/>
                    </div>
                    <div id="prizeArea3">
                        <input type="text" id="PrizeTitle3" ref="PrizeTitle3" placeholder="Prize Title"/>
                        <select id="IsPremium3" ref="IsPremium3">
                            <option value="true" selected>true</option>
                            <option value="false">false</option>
                        </select>
                        <input type="text" id="PrizeImageUrl3" ref="PrizeImageUrl3" placeholder="Prize Image Url"/>
                    </div>
                    <div id="prizeArea4">
                        <input type="text" id="PrizeTitle4" ref="PrizeTitle4" placeholder="Prize Title"/>
                        <select id="IsPremium4" ref="IsPremium4">
                            <option value="true" selected>true</option>
                            <option value="false">false</option>
                        </select>
                        <input type="text" id="PrizeImageUrl4" ref="PrizeImageUrl4" placeholder="Prize Image Url"/>
                    </div>
                    <div id="prizeArea5">
                        <input type="text" id="PrizeTitle5" ref="PrizeTitle5" placeholder="Prize Title"/>
                        <select id="IsPremium5">
                            <option value="true" selected>true</option>
                            <option value="false">false</option>
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

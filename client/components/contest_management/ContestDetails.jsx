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


        $(document).ready(function(){
            $( ".add-row" ).click(function(){
                var $clone = $( "#prizeArea" ).first().clone();
                $clone.append( "<button type='button' class='remove-row'>-</button>" );
                $clone.insertBefore( ".add-row" );
            });

            $( ".remove-row" ).on("click", ".remove-row", function(){
                console.log("remove clicked");
                $(this).parent().remove();
            });
        });
    }

    componentWillUnmount() {
        this.state.subscription.xbdContests.stop();
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
                    <div id="prizeArea">
                        <input type="text" id="PrizeTitle" placeholder="Prize Title"/>
                        <select id="IsPremium">
                            <option value="true" selected>true</option>
                            <option value="false">false</option>
                        </select>
                        <input type="text" id="PrizeImageUrl" placeholder="Prize Image Url"/>
                    </div>
                    <button type="button" className="add-row">+</button>
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

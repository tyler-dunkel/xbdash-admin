import React, {Component} from 'react';
import {SearchSource} from 'meteor/meteorhacks:search-source';
import TrackerReact from 'meteor/ultimatejs:tracker-react';
import ContestSearchResult from './ContestSearchResult.jsx';

let options = { keepHistory: 1000 * 60 * 5, localSearch: true };
let fields = ['title', 'type'];
SearchContests = new SearchSource('contests', fields, options);

export default class ContestSearch extends TrackerReact(Component) {
    getContests() {
        return SearchContests.getData({
            transform(matchText, regExp) {
                return matchText.replace(regExp, "<b>$&</b>")
            },
            sort: { isoScore: -1 }
        });
    }

    isLoading() {
        return SearchContests.getStatus();
    }

    handleChange(e) {
        var text = $(e.target).val().trim();
        SearchContests.search(text, options);
    }

    render() {
        if (this.isLoading().loaded != true) {
            return (
                <div>
                    <input type="text" id="search-box" placeholder="search contests..." onKeyUp={this.handleChange} />
                    <div>
                        Searching...
                    </div>
                </div>
            )
        }
        return (
            <div>
                <input type="text" id="search-box" placeholder="search contests..." onKeyUp={this.handleChange} />
                <div>
                    <div className="collection">
                        {this.getContests().map((contest) => {
                            return <ContestSearchResult contest={contest} />
                        }) }
                    </div>
                </div>
            </div>
        )
    }
}
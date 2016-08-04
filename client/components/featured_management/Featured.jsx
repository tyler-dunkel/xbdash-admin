import React, {Component} from 'react';
import TrackerReact from 'meteor/ultimatejs:tracker-react';
import SearchBar from 'react-search-bar';
import FeaturedArea from './FeaturedArea.jsx';

export default class Featured extends TrackerReact(Component) {
    onChange(input, resolve) {
        const matches = {
            'macbook a': [
                'macbook air 13 case',
                'macbook air 11 case',
                'macbook air charger'
            ],
            'macbook p': [
                'macbook pro 13 case',
                'macbook pro 15 case',
                'macbook pro charger'
            ]
        };
        setTimeout(() => {
            const suggestions = matches[Object.keys(matches).find((partial) => {
                return input.match(new RegExp(partial), 'i');
            })] || ['macbook', 'macbook air', 'macbook pro'];

            resolve(suggestions.filter((suggestion) =>
                suggestion.match(new RegExp('^' + input.replace(/\W\s/g, ''), 'i'))
            ));
        }, 25);
    }

    onSearch(input) {
        if (!input) return;
        console.info(`Searching "${input}"`);
    }

    onSubmit(submitted) {
        console.log(submitted);
    }
    render() {
        return (
            <div>
                <SearchBar
                    placeholder="Search for the new featured content"
                    onChange={this.onChange}
                    onSearch={this.onSearch}
                    onSubmit={this.onSubmit} />
                <FeaturedArea />
            </div>
        );
    }

}
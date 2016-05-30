import React, {Component} from 'react';
import TrackerReact from 'meteor/ultimatejs:tracker-react';

export default class WysiwygEditor extends TrackerReact(Component) {

  constructor(){
    super();
    this.state = {
      subscription: {
        xbdNews: Meteor.subscribe("allxbdnews")
      }
    }
  }

  componentWillUnmount(){
    this.state.subscription.xbdNews.stop();
  }

  getArticle(){
    return xbdNews.findOne({_id: this.props.id});
  }

  componentDidMount() {
    $(document).ready(function() {
      $('#wysiwyg-editor').summernote();
    });  }

    render() {
      console.log(this.getArticle());
      return (
        <div id="wysiwyg-editor"></div>
      )
    }
}

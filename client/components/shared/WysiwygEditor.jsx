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
    return xbdNews.findOne(this.props.id);
  }

  componentDidMount() {
    let article = this.getArticle();
    console.log("Editor component mounted.");
    $(document).ready(function() {
      $('#wysiwyg-editor').summernote('code', article.content);
    });}

    render() {
      let article = this.getArticle();
      console.log(article);
      if(!article){
        console.log("Loading editor");
        return(<div>Loading Editor...</div>)
      }

      return (
        <div id="wysiwyg-editor"></div>
      )
    }
}

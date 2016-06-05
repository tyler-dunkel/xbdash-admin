import React, {Component} from 'react';
import TrackerReact from 'meteor/ultimatejs:tracker-react';

export default class ArticlePublished extends TrackerReact(Component) {
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

  render() {
    let article = this.getArticle();
    if(!article){
      return(<div>Loading published date...</div>)
    }
    return (
      <b>Published: {article.published}</b>
    )
  }
}

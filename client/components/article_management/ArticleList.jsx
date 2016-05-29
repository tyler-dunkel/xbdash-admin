import React,{Component} from 'react';
import TrackerReact from 'meteor/ultimatejs:tracker-react';

import ArticleSingle from './ArticleSingle.jsx';

xbdNews = new Mongo.Collection("xbdnews");

export default class ArticleList extends TrackerReact(Component) {

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

  getAllArticles(){
    return xbdNews.find().fetch();
  }

  render() {
    return (
      <div>
        {this.getAllArticles().map( (article)=>{
          return <ArticleSingle article={article} />
        })}
      </div>
    )
  }
}

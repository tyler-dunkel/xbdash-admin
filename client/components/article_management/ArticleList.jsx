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
    return xbdNews.find({ "source": "xbdash" }, { sort: { "published": -1 }}).fetch();
  }

  render() {
    if(!this.getAllArticles()){
      console.log("Loading Articles");
      return(
        <div>Loading...</div>
      )
    }
    return (
      <div>
        {this.getAllArticles().map( (article)=>{
          return <ArticleSingle article={article} />
        })}
      </div>
    )
  }
}

import React,{Component} from 'react';
import TrackerReact from 'meteor/ultimatejs:tracker-react';
import ArticleTitle from './ArticleTitle.jsx';
import ArticlePublished from './ArticlePublished.jsx';


export default class ArticleDetails extends TrackerReact(Component){
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

  render(){
    return(
      <div>
      <ArticleTitle id={this.props.id} />
      <ArticlePublished id={this.props.id} />
      </div>
    )
  }
}

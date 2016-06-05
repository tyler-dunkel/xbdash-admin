import React,{Component} from 'react';
import TrackerReact from 'meteor/ultimatejs:tracker-react';

export default class ArticleTitle extends TrackerReact(Component){
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

    if(!article && this.props.id!='new'){
      return(<div>Loading title...</div>)
    } else if(article && this.props.id!='new'){
      return (
        <h4>{article.title}</h4>
      )
    } else {
      return (
        <h4>Title</h4>
      )
    }

  }
};

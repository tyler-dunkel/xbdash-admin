import React, {Component} from 'react';
import TrackerReact from 'meteor/ultimatejs:tracker-react';
import InlineEdit from 'react-edit-inline';

export default class ArticleAuthor extends TrackerReact(Component) {
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
      return(<div className="row">Loading author...</div>)
    } else if(article && this.props.id!='new') {
      console.log("Article author component mounted");
      return(
        <InlineEdit
          activeClassName="editing"
          text={article.author}
          paramName="author"
          style={{
            display: 'inline-block',
            fontSize: 15,
          }}
          />
      )
    } else{
      console.log("Article author component mounted");
      return(
        <InlineEdit
          activeClassName="editing"
          text="Enter author"
          paramName="author"
          style={{
            display: 'inline-block',
            fontSize: 15,
          }}
          />
          )
        }
      }
    }
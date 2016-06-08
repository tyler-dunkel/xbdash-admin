import React, {Component} from 'react';
import TrackerReact from 'meteor/ultimatejs:tracker-react';
import InlineEdit from 'react-edit-inline';

export default class ArticleSlug extends TrackerReact(Component) {
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
      return(<div className="row">Loading slug...</div>)
    } else if(article && this.props.id!='new') {
      console.log("Article slug component mounted");
      return(
        <InlineEdit
          activeClassName="editing"
          text={article.slug}
          paramName="slug"
          style={{
            display: 'inline-block',
            fontSize: 15,
          }}
          />
      )
    } else{
      console.log("Article slug component mounted");
      return(
        <InlineEdit
          activeClassName="editing"
          text="Enter slug"
          paramName="slug"
          style={{
            display: 'inline-block',
            fontSize: 15,
          }}
          />
          )
        }
      }
    }

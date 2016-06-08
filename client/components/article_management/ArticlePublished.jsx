import React, {Component} from 'react';
import TrackerReact from 'meteor/ultimatejs:tracker-react';
import InlineEdit from 'react-edit-inline';

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
    if(!article && this.props.id!='new'){
      return(<div className="row">Loading published date...</div>)
    } else if(article && this.props.id!='new') {
      let published = "Published " + article.published.toString();
      console.log("Article published component mounted");
      return(
        <InlineEdit
          activeClassName="editing"
          text={published}
          paramName="published"
          style={{
            display: 'inline-block',
            fontSize: 15,
          }}
          />
      )
    } else{
      console.log("Article published component mounted");
      let date = new Date().toString();
      return(
        <InlineEdit
          activeClassName="editing"
          text={date}
          paramName="published"
          style={{
            display: 'inline-block',
            fontSize: 15,
          }}
          />
          )
        }
      }
    }

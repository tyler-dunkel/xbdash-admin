import React, {Component} from 'react';
import TrackerReact from 'meteor/ultimatejs:tracker-react';
import InlineEdit from 'react-edit-inline';

export default class ArticleUpdated extends TrackerReact(Component) {
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
      return(<div className="row">Loading updated date...</div>)
    } else if(article && this.props.id!='new') {
      let updated = "Published " + article.updated.toString();
      console.log("Article updated component mounted");
      return(
        <InlineEdit
          activeClassName="editing"
          text={updated}
          paramName="updated"
          style={{
            display: 'inline-block',
            fontSize: 15,
          }}
          />
      )
    } else{
      console.log("Article updated component mounted");
      let date = new Date().toString();
      return(
        <InlineEdit
          activeClassName="editing"
          text={date}
          paramName="updated"
          style={{
            display: 'inline-block',
            fontSize: 15,
          }}
          />
          )
        }
      }
    }

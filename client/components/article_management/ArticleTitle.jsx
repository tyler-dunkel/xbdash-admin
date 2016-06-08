import React,{Component} from 'react';
import TrackerReact from 'meteor/ultimatejs:tracker-react';
import InlineEdit from 'react-edit-inline';

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
      console.log("Article title component mounted");
      return (
        <InlineEdit
          activeClassName="editing"
          text={article.title}
          paramName="title"
          style={{
            display: 'inline-block',
            fontSize: 25,
          }}
          />
      )
    } else {
      console.log("Article new title component mounted");
      return (
        <InlineEdit
          activeClassName="editing"
          text="Title"
          paramName="title"
          style={{
            display: 'inline-block',
            fontSize: 25,
          }}
          />
      )
    }
  }
};

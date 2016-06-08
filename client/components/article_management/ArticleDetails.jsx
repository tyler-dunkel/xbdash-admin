import React,{Component} from 'react';
import TrackerReact from 'meteor/ultimatejs:tracker-react';
import ArticleTitle from './ArticleTitle.jsx';
import ArticlePublished from './ArticlePublished.jsx';
import ArticleUpdated from './ArticleUpdated.jsx';
import ArticleAuthor from './ArticleAuthor.jsx';
import ArticleSlug from './ArticleSlug.jsx';
import ArticleSource from './ArticleSource.jsx';

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
    console.log("Article details component mounted.");
    return(
      <div>
        <div className="section">
          <h5>Title</h5>
          <ArticleTitle id={this.props.id} />
        </div>
        <div className="divider"></div>
        <div className="section">
          <h5>Published</h5>
          <ArticlePublished id={this.props.id} />
        </div>
        <div className="divider"></div>
        <div className="section">
          <h5>Updated</h5>
          <ArticleUpdated id={this.props.id} />
        </div>
        <div className="divider"></div>
        <div className="section">
          <h5>Author</h5>
          <ArticleAuthor id={this.props.id} />
        </div>
        <div className="divider"></div>
        <div className="section">
          <h5>Slug</h5>
          <ArticleSlug id={this.props.id} />
        </div>
        <div className="divider"></div>
        <div className="section">
          <h5>Source</h5>
          <ArticleSource id={this.props.id} />
        </div>
        <div className="divider"></div>
      </div>
    )
  }
}

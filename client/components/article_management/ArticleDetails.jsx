import React,{Component} from 'react';
import TrackerReact from 'meteor/ultimatejs:tracker-react';
import ArticleTitle from './ArticleTitle.jsx';
import ArticlePublished from './ArticlePublished.jsx';
import ArticleUpdated from './ArticleUpdated.jsx';
import ArticleAuthor from './ArticleAuthor.jsx';
import ArticleSlug from './ArticleSlug.jsx';
import ArticleSource from './ArticleSource.jsx';
import WysiwygEditor from '../shared/WysiwygEditor.jsx';

export default class ArticleDetails extends TrackerReact(Component){
  constructor(){
    super();
    this.state = {
      subscription: {
        xbdNews: Meteor.subscribe("allxbdnews")
      }
    }
  }

  componentDidMount() {
    if(this.props.id!='new'){
      let article = this.getArticle();
      console.log("Editor component to edit article mounted.");
      $(document).ready(function() {
        $('#wysiwyg-editor').summernote('code', article.content);
      });
    } else {
      console.log("Editor component for new article mounted.");
      $(document).ready(function() {
        $('#wysiwyg-editor').summernote();
      });
    }
  }

  componentWillUnmount(){
    this.state.subscription.xbdNews.stop();
  }

  getArticle(){
    return xbdNews.findOne(this.props.id);
  }

  addArticle(event) {
    event.preventDefault();
    console.log(this);
  }

  render(){
    let article = this.getArticle();
    console.log("Article details component mounted.");
    if(!article){
      return(
        <div>Loading details...</div>
      )
    }
    return(
      <div>
        <form onSubmit={this.addArticle.bind(this)}>
          <input type="text" ref="Title" placeholder={article.title} />
          <input type="text" ref="Published" placeholder={article.published}/>
          <input type="text" ref="Updated" placeholder={article.updated} />
          <input type="text" ref="Author" placeholder={article.author} />
          <input type="text" ref="Slug" placeholder={article.slug} />
          <input type="text" ref="Source" placeholder={article.source} />
          <WysiwygEditor id={this.props.id}/>
          <button type="submit" className="btn waves-effect waves-light">Submit</button>
        </form>
      </div>
    )
  }
}

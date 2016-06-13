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
    let id = this.props.id;
    let published = this.refs.Published.value.trim();
    let title = this.refs.Title.value.trim();
    let author = this.refs.Author.value.trim();
    let slug = this.refs.Slug.value.trim();
    let source = this.refs.Source.value.trim();
    let wysiwygHtml = $('#wysiwyg-editor').summernote('code');
    console.log(this.refs);
    Meteor.call('addArticleServer', id, published, title, author, slug, source, wysiwygHtml)
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
        <input type="text" id="Title" ref="Title" placeholder={article.title} value={article.title} />
        <input type="text" id="Published" ref="Published" placeholder={article.published} value ={article.published} />
        <input type="text" id="Updated" ref="Updated" placeholder={article.updated} value ={article.published} />
        <input type="text" id="Author" ref="Author" placeholder={article.author} value ={article.author} />
        <input type="text" id="Slug" ref="Slug" placeholder={article.slug} value ={article.slug} />
        <input type="text" id="Source" ref="Source" placeholder={article.source} value ={article.source} />
        <WysiwygEditor id={this.props.id}/>
        <button type="submit" className="btn waves-effect waves-light">Submit</button>
      </form>
    </div>
  )

}
}

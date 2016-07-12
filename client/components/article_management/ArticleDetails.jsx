import React, {Component} from 'react';
import TrackerReact from 'meteor/ultimatejs:tracker-react';
import WysiwygEditor from '../shared/WysiwygEditor.jsx';


export default class ArticleDetails extends TrackerReact(Component) {
  constructor() {
    super();
    this.state = {
      subscription: {
        xbdNews: Meteor.subscribe("allxbdnews")
      }
    }
  }

  componentDidMount() {
    console.log("Article details component mounted.");
    if (this.props.id != 'new') {
      let article = this.getArticle();
      console.log("Editor component to edit article mounted.");
      $(document).ready(function () {
        $('#wysiwyg-editor').summernote('code', article.content);
      });
    } else {
      console.log("Editor component for new article mounted.");
      $(document).ready(function () {
        $('#wysiwyg-editor').summernote();
      });
    }
  }

  componentWillUnmount() {
    this.state.subscription.xbdNews.stop();
  }

  getArticle() {
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
    let linkhref = this.refs.LinkHref.value.trim();
    let wysiwygHtml = $('#wysiwyg-editor').summernote('code');
    console.log(wysiwygHtml);
    Meteor.call('addArticleServer', id, published, title, author, slug, source, linkhref, wysiwygHtml, () => {
      console.log("Article submitted");
      Materialize.toast('Article submitted', 4000);
    })
  }

  render() {
    let article = this.getArticle();
    if (!article && this.props.id != 'new') {
      return (
        <div>Loading details...</div>
      )
    } if (!article && this.props.id == 'new') {
      let newDate = new Date();
      return (
        <div>
          <form onSubmit={this.addArticle.bind(this) }>
            <input type="text" id="Title" ref="Title" placeholder="Title" />
            <input type="text" id="Published" ref="Published" placeholder={newDate} defaultValue={newDate}/>
            <input type="text" id="Updated" ref="Updated" placeholder={newDate} defaultValue={newDate} />
            <input type="text" id="Author" ref="Author" placeholder="Author" />
            <input type="text" id="Slug" ref="Slug" placeholder="Slug" />
            <input type="text" id="Source" ref="Source" placeholder="Source" />
            <input type="text" id="LinkHref" ref="LinkHref" placeholder="Link href" />
            <WysiwygEditor id={this.props.id}/>
            <button type="submit" className="btn waves-effect waves-light">Submit</button>
          </form>
        </div>
      )
    } else {
      let newDate = new Date();
      return (
        <div>
          <form onSubmit={this.addArticle.bind(this) }>
            <input type="text" id="Title" ref="Title" placeholder={article.title} defaultValue={article.title} />
            <input type="text" id="Published" ref="Published" placeholder={article.published} defaultValue ={article.published} />
            <input type="text" id="Updated" ref="Updated" placeholder={newDate} defaultValue ={newDate} />
            <input type="text" id="Author" ref="Author" placeholder={article.author} defaultValue ={article.author} />
            <input type="text" id="Slug" ref="Slug" placeholder={article.slug} defaultValue ={article.slug} />
            <input type="text" id="Source" ref="Source" placeholder={article.source} defaultValue ={article.source} />
            <input type="text" id="LinkHref" ref="LinkHref" placeholder={article.link.href} defaultValue ={article.link.href} />
            <WysiwygEditor id={this.props.id}/>
            <button type="submit" className="btn waves-effect waves-light">Submit</button>
          </form>
        </div>
      )
    }

  }
}

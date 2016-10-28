import React, { Component } from 'react';
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
    let type = this.refs.Type.value.trim();
    let gameId = this.refs.GameId.value.trim();
    let featuredImage = this.refs.FeaturedImage.value.trim();
    let shareImage = this.refs.ShareImage.value.trim();
    let wysiwygHtml = $('#wysiwyg-editor').summernote('code');

    Meteor.call('addArticleServer', id, published, title, author, slug, source, linkhref, type, gameId, featuredImage, shareImage, wysiwygHtml, (error, result) => {
      console.log(error);
      console.log(result);
      if (error) {
        Materialize.toast('You are not authorized to submit a article.');
      } else if (result) {
        Materialize.toast(result, 4000);
      }
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
          <form onSubmit={this.addArticle.bind(this)}>
            <input type="text" id="Title" ref="Title" placeholder="Title" />
            <input type="text" id="Published" ref="Published" placeholder={newDate} defaultValue={newDate} />
            <input type="text" id="Updated" ref="Updated" placeholder={newDate} defaultValue={newDate} />
            <input type="text" id="Author" ref="Author" placeholder="Author" />
            <input type="text" id="Slug" ref="Slug" placeholder="Slug" />
            <input type="text" id="Source" ref="Source" placeholder="Source" />
            <input type="text" id="LinkHref" ref="LinkHref" placeholder="Link href" />
            <input type="text" id="Type" ref="Type" placeholder="Type" />
            <input type="text" id="GameId" ref="GameId" placeholder="When entering GameId use commas to separate each one. I.E hello,test,hey" />
            <input type="text" id="FeaturedImage" ref="FeaturedImage" placeholder="Featured Image" />
            <input type="text" id="ShareImage" ref="ShareImage" placeholder="Share Image" />
            <WysiwygEditor id={this.props.id} />
            <button type="submit" className="btn waves-effect waves-light">Submit</button>
          </form>
        </div>
      )
    } else {
      let newDate = new Date();
      return (
        <div>
          <form onSubmit={this.addArticle.bind(this)}>
            <input type="text" id="Title" ref="Title" placeholder={article.title} defaultValue={article.title} />
            <input type="text" id="Published" ref="Published" placeholder={article.published} defaultValue={article.published} />
            <input type="text" id="Updated" ref="Updated" placeholder={newDate} defaultValue={newDate} />
            <input type="text" id="Author" ref="Author" placeholder={article.author} defaultValue={article.author} />
            <input type="text" id="Slug" ref="Slug" placeholder={article.slug} defaultValue={article.slug} />
            <input type="text" id="Source" ref="Source" placeholder={article.source} defaultValue={article.source} />
            <input type="text" id="LinkHref" ref="LinkHref" placeholder={article.link.href} defaultValue={article.link.href} />
            <input type="text" id="Type" ref="Type" placeholder={article.type} defaultValue={article.type} />
            <input type="text" id="GameId" ref="GameId" placeholder={article.gameId} defaultValue={article.gameId} />
            <input type="text" id="FeaturedImage" ref="FeaturedImage" placeholder={article.featuredImage} defaultValue={article.featuredImage} />
            <input type="text" id="ShareImage" ref="ShareImage" placeholder={article.shareImage} defaultValue={article.shareImage} />
            <WysiwygEditor id={this.props.id} />
            <button type="submit" className="btn waves-effect waves-light">Submit</button>
          </form>
        </div>
      )
    }

  }
}

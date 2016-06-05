import React, {Component} from 'react';
import TrackerReact from 'meteor/ultimatejs:tracker-react';

export default class WysiwygEditor extends TrackerReact(Component) {

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


    render() {
      let article = this.getArticle();
      console.log(article);
      if(!article && this.props.id!='new'){
        console.log("Loading editor");
        return(<div>Loading Editor...</div>)
      }

      return (
        <div>
        <div id="wysiwyg-editor"></div>
          <button className="btn waves-effect waves-light" type="submit" name="action">Submit</button>
        </div>
      )
    }
}

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
      $(document).ready(function() {
        $('#wysiwyg-editor').summernote('code', article.content);
      });
    } else {
      $(document).ready(function() {
        $('#wysiwyg-editor').summernote();
      });
    }
  }


    render() {
      let article = this.getArticle();
      if(!article && this.props.id!='new'){
        return(<div className="row">Loading Editor...</div>)
      }

      return (
          <textarea class="input-block-level" id="wysiwyg-editor" name="content" ref="Content">
					</textarea>
      )
    }
}

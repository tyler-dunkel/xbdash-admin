import React, {Component} from 'react';

export default class WysiwygEditor extends Component {

  componentDidMount() {
    $(document).ready(function() {
      $('#wysiwyg-editor').summernote();
    });  }

  render() {
    return (
      <div id="wysiwyg-editor"></div>
    )
  }
}

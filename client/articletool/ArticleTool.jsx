import React from 'react';
import ReactDOM from 'react-dom';

import WysiwygEditor from '../components/WysiwygEditor.jsx';
//Resolutions = new Mongo.Collection('resolutions');

export default class ArticleTool extends React.Component {

  render() {
    return (
      <div>
        <WysiwygEditor />
      </div>
    )
  }
}

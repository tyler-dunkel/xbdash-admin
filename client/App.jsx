import React from 'react';
import ReactDOM from 'react-dom';

import WysiwygEditor from './WysiwygEditor.jsx';
//Resolutions = new Mongo.Collection('resolutions');

export default class App extends React.Component {

  render() {
    return (
      <div>
        <WysiwygEditor />
      </div>
    )
  }
}

import React, {Component} from 'react';
import Nav from '../components/shared/Nav.jsx';

export const ArticleEditorNew = ({editor}) => (
  <div>
    <Nav />
    <div className="container">
      <div>
          Insert new title
      </div>
      <div>
        {editor}
      </div>
    </div>
  </div>
)

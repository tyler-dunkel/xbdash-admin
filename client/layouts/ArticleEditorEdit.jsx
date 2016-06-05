import React from 'react';
import Nav from '../components/shared/Nav.jsx';

export const ArticleEditorEdit = ({article_details,editor}) => (
  <div>
    <Nav />
    <div className="container">
      <div>
        {article_details}
      </div>
      <div>
        {editor}
      </div>
    </div>
  </div>
)

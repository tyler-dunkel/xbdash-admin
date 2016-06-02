import React from 'react';

import Nav from '../components/shared/Nav.jsx';
import ArticleNewButton from '../components/article_management/ArticleNewButton.jsx';

export const ArticleEditorMain = ({articles}) => (
  <div>
    <Nav />
    <div className="container">
      <ArticleNewButton />
      {articles}
    </div>
  </div>
)

import React from 'react';

import Nav from '../components/shared/Nav.jsx';
import ArticleList from '../components/article_management/ArticleList.jsx';

export const ArticleEditorMain = ({content}) => (
  <div>
    <Nav />
    <div className="container">
      <ArticleList />
    </div>
  </div>
)

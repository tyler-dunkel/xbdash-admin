import React from 'react';

import Nav from '../components/shared/Nav.jsx';
import ArticleNewButton from '../components/article_management/ArticleNewButton.jsx';
import CloudinaryUploadButton from '../components/shared/CloudinaryUploadButton.jsx';

export const ArticleEditorMain = ({articles}) => (
  <div>
    <Nav />
    <div className="container">
      <ArticleNewButton />
      <CloudinaryUploadButton />
      {articles}
    </div>
  </div>
)

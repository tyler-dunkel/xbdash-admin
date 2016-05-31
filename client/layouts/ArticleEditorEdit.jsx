import React from 'react';

import Nav from '../components/shared/Nav.jsx';
import ArticleTitle from '../components/article_management/ArticleTitle.jsx';
import WysiwygEditor from '../components/shared/WysiwygEditor.jsx';

export const ArticleEditorMain = ({content}) => (
  <div>
    <Nav />
    <div className="container">
      {content}
    </div>
  </div>
)

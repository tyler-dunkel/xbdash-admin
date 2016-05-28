import React from 'react';

import Nav from '../components/shared/Nav.jsx';
import ArticleTitle from '../components/article_management/ArticleTitle.jsx';
import WysiwygEditor from '../components/WysiwygEditor.jsx';

export const ArticleEditorMain = ({content}) => (
  <div>
    <Nav />
    <div className="container">
      <div>
        <ArticleTitle />
      </div>
      <div>
        <WysiwygEditor />
      </div>
    </div>
  </div>
)

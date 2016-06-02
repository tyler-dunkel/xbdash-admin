import React from 'react';

import Nav from '../components/shared/Nav.jsx';

export const ArticleEditorMain = ({articles}) => (
  <div>
    <Nav />
    <div className="container">
      {articles}
    </div>
  </div>
)

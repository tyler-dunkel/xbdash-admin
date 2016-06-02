import React from 'react';

import Nav from '../components/shared/Nav.jsx';

export const ArticleEditorEdit = ({title,editor}) => (
  <div>
    <Nav />
    <div className="container">
      <div>
      {title}
    </div>
    <div>
      {editor}
    </div>
    </div>
  </div>
)

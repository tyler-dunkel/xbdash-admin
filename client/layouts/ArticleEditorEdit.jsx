import React from 'react';
import Nav from '../components/shared/Nav.jsx';
import CloudinaryUploadButton from '../components/shared/CloudinaryUploadButton.jsx';

export const ArticleEditorEdit = ({article_details,editor}) => (
  <div>
    <Nav />
    <div className="container">
      <CloudinaryUploadButton />
      <div id="cloudinary_links"></div>
      <div>
        {article_details}
      </div>
      <div>
        {editor}
      </div>
    </div>
  </div>
)

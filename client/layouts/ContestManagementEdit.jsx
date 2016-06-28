import React from 'react';
import Nav from '../components/shared/Nav.jsx';
import CloudinaryUploadButton from '../components/shared/CloudinaryUploadButton.jsx';

export const ContestManagementEdit = ({contest_details}) => (
  <div>
    <Nav />
    <div className="container">
      <CloudinaryUploadButton />
      <div>
        <table className="highlight">
          <thead>
            <tr>
              <th data-field="thumbnail">Thumbnail</th>
              <th data-field="url">URL</th>
            </tr>
          </thead>
          <tbody id="cloudinary_links">

          </tbody>
        </table>
      </div>
    <div>
      {contest_details}
    </div>
  </div>
</div>
)

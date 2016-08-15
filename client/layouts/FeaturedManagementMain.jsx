import React from 'react';
import Nav from '../components/shared/Nav.jsx';

export const FeaturedManagementMain = ({featured}) => (
  <div>
    <Nav />
    <div className="container ">
      {featured}
    </div>
  </div>
)

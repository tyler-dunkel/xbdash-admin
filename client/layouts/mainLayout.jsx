import React from 'react';

export default MainLayout = ({header, content, footer}) => (
  <div>
    {header}
  <div className="container">
    {content()}
  </div>
    {footer}
  </div>
);

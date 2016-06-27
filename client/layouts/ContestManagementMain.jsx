import React from 'react';
import ContestNewButton from '../components/contest_management/ContestNewButton.jsx';
import Nav from '../components/shared/Nav.jsx';

export const ContestManagementMain = ({contests}) => (
  <div>
    <Nav />
    <div className="container">
      <ContestNewButton />
      {contests}
    </div>
  </div>
)

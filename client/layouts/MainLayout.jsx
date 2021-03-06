import React from 'react';

import Nav from '../components/shared/Nav.jsx';
import Home from '../components/home/Home.jsx';
import AccountsUI from '../components/auth/AccountsUI.jsx';

export const MainLayout = ({content}) => (
  <div className="main-layout ">
    <Nav />
    <div className="container">
      <Home />
    </div>
  </div>
)

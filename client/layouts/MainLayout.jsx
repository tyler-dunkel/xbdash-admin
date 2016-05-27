import React from 'react';

export const MainLayout = ({content}) => (
  <div className="main-layout">
  <header>
  <nav className="green lighten-1" role="navigation">
  <div className="nav-wrapper container"><a id="logo-container" href="/" className="brand-logo">XBDash Admin</a>
    <ul className="right hide-on-med-and-down">
      <li><a href="/">Logout</a></li>
    </ul>

    <ul id="nav-mobile" className="side-nav">
      <li><a href="#">Logout</a></li>
    </ul>
    <a href="#" data-activates="nav-mobile" className="button-collapse"><i className="material-icons">menu</i></a>
  </div>
</nav>
</header>
    {content}
  </div>
)

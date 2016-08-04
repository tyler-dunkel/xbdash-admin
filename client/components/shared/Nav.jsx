import React, {Component} from 'react';
import AccountsUI from '../auth/AccountsUI.jsx';

export default class Nav extends Component {
  componentDidMount() {
    $(".button-collapse").sideNav();
  }
  render() {
    return (
      <header>
        <nav>
          <div className="nav-wrapper green">
            <a href="/" className="brand-logo">XBdash Admin</a>
            <a href="#" data-activates="mobile" className="button-collapse"><i className="material-icons">menu</i></a>
            <ul className="right hide-on-med-and-down">
              <li><a href="articletool">Articles</a></li>
              <li><a href="contesttool">Contests</a></li>
              <li><a href="announcementtool">Announcements</a></li>
              <li><a href="featuredtool">Featured</a></li>
              <li><AccountsUI /></li>
            </ul>
            <ul className="side-nav" id="mobile">
              <li><a href="articletool">Articles</a></li>
              <li><a href="contesttool">Contests</a></li>
              <li><a href="announcementtool">Announcements</a></li>
              <li><a href="featuredtool">Featured</a></li>
              <li><AccountsUI /></li>
            </ul>
          </div>
        </nav>
      </header>

    )
  }
}

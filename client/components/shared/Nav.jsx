import React,{Component} from 'react';
import AccountsUI from '../auth/AccountsUI.jsx';

export default class Nav extends Component{
  componentDidMount(){
    $(".button-collapse").sideNav();
  }
  render() {
    return (
      <header>
        <nav className="green lighten-1" role="navigation">
          <div className="nav-wrapper container"><a id="logo-container" href="/" className="brand-logo">XBDash Admin</a>
          <ul className="right hide-on-med-and-down">
              <li><AccountsUI /></li>
          </ul>

          <ul id="nav-mobile" className="side-nav">
            <li><AccountsUI /></li>
          </ul>
          <a href="#" data-activates="nav-mobile" className="button-collapse"><i className="material-icons">menu</i></a>
        </div>
      </nav>
    </header>

  )
}
}

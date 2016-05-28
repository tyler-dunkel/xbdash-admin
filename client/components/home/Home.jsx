import React from 'react';

export default Home = ({name}) => (
  <div>
  <div className="section no-pad-bot" id="index-banner">
    <div className="container">
      <br/><br/>
      <h1 className="header center green-text">Hello, {name}</h1>
      <div className="row center">
        <a href="articletool" id="article-management-button" className="btn-large waves-effect waves-light orange">Article Management</a>
        <a href="#" id="contest-management-button" className="btn-large waves-effect waves-light orange">Contest Management</a>
      </div>
      <br/><br/>
    </div>
  </div>
  <div className="container"/>
  <br/><br/>
</div>
);

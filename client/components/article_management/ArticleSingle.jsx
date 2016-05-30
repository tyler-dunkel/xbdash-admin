import React,{Component} from 'react';

export default class ArticleSingle extends Component{
  render() {
    return (
      <div classNameName="row">
        <div className="col s12 m6">
          <div className="card blue-grey darken-1">
            <div className="card-content white-text">
              <span className="card-title">{this.props.article.title}</span>
              <ul>
                <li>{this.props.article.author}</li>
              </ul>
            </div>
            <div className="card-action">
              <a href="#">Edit</a>
              <a href="#">Delete</a>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

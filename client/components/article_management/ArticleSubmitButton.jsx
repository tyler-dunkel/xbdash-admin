import React,{Component} from 'react';

export default class ArticleSubmitButton extends Component {
  render(){
    return (
      <button class="btn waves-effect waves-light" type="submit" name="action">Submit
        <i class="material-icons right">send</i>
      </button>
    )
  }
}

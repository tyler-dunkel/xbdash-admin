import React,{Component} from 'react';

export default class CloudinaryUploadButton extends Component{

  render(){
    return(
      <button onclick="cloudinaryUpload()" className="waves-effect waves-light btn">Cloudinary Upload</button>
    )
  }
}

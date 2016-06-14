import React,{Component} from 'react';

export default class CloudinaryUploadButton extends Component{

  cloudinaryUpload() {
    console.log("Test");
    Materialize.toast("Cloudinary Button clicked", 4000);
  }

  render(){
    return(
      <button onclick="cloudinaryUpload()" className="waves-effect waves-light btn">Cloudinary Upload</button>
    )
  }
}

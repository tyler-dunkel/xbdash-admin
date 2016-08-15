import React,{Component} from 'react';

export default class CloudinaryUploadButton extends Component{
  componentDidMount() {
    const script = document.createElement("script");
    script.src = "//widget.cloudinary.com/global/all.js";
    script.async = true;
    document.body.appendChild(script);

    const script_cloudinary_custom = document.createElement("script");
    script_cloudinary_custom.src = "/js/cloudinary_upload.js";
    script_cloudinary_custom.type = "text/javascript";
    script_cloudinary_custom.async = true;
    document.body.appendChild(script_cloudinary_custom);
}
  render(){
    return(
      <a href="#" id="upload_widget_opener" className="waves-effect waves-light btn white green-text">Cloudinary Upload</a>
    )
  }
}

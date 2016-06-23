$(function() {
  var cloudinary_upload = document.getElementById("upload_widget_opener");

  if(cloudinary_upload){
    cloudinary_upload.addEventListener("click", function() {
      console.log("Cloudinary upload widget opened.");
      cloudinary.openUploadWidget({ cloud_name: 'xbdash', upload_preset: 'u2t0pjrn'},
        function(error, result) { console.log(error, result) });

    }, false);
  }
});

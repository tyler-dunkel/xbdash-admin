$(function() {
  var cloudinary_upload = document.getElementById("upload_widget_opener");
  if(cloudinary_upload){
    cloudinary_upload.addEventListener("click", function() {
      cloudinary.openUploadWidget({ cloud_name: 'xbdash', upload_preset: 'u2t0pjrn', 'folder': 'articles'},
        function(error, result) {
          for (var i =0; i < result.length; i++){
            $( "#cloudinary_links" ).append("<tr><td><img src=\""+result[i].thumbnail_url+"\"/></td><td>"+result[i].url+"</td></tr>");
          }
        });
    }, false);
  }
});

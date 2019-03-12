import { data } from "./events.js";

// Load File
function loadFile(evt) {
    var files = $('#files')[0].files; // FileList object
  
    // files is a FileList of File objects. List some properties.
    for (var i = 0, f; f = files[i]; i++) {
      if(!f.type.match("text/*"))
        continue;
      
      data.reset();
      
      var reader = new FileReader();
  
      // Closure to capture the file information.
      reader.onload = (function(theFile) {
        return function(e) {
          // Render thumbnail.
          var content = e.target.result.split(/\s+/).map(parseFloat);
          var minx = content[0], maxx = content[0], miny = content[1], maxy = content[1];
          for(var i = 0; i+1<content.length; i+=2){
            minx = Math.min(minx,content[i]);
            miny = Math.min(miny,content[i+1]);
            maxx = Math.max(maxx,content[i]);
            maxy = Math.max(maxy,content[i+1]);
          }
          var bb = [minx, maxy, maxx, miny];
          
          data.delete_board();
          data.create_board(bb);
  
          for(var i = 0; i+1<content.length; i+=2){
            data.add_point(content[i], content[i+1], 'red');
          }
        };
      })(f);
      // Read in the image file as a data URL.
      reader.readAsText(f);
    }
  }
  $('#Load').click(loadFile);
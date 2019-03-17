import { board } from "./board.js";
import { sites } from "./sites.js";
import { polygon } from "./polygon.js";
import {Polygon_UI} from './UI/polygon_ui.js';
import {Voronoi_UI} from './UI/voronoi_ui.js';

function load(files, collection, UI, color){
  for (var i = 0, f; f = files[i]; i++) {
    if(!f.type.match("text/*")) continue;
    var reader = new FileReader();
    
    // Closure to capture the file information.
    reader.onload = (function(theFile) {
      return function(e) {
        var content = e.target.result.split(/\s+/).map(parseFloat);
        for(var i = 0; i+1<content.length; i+=2){
          collection.add(content[i], content[i+1], color);
        }
        console.log(content.join(', '));
        if(collection.finish)
          collection.finish();
        UI.show();
      };
    })(f);
    // Read in the image file as a data URL.
    reader.readAsText(f);
  }
}

// Load File
function loadSites(evt) {
  if(sites.get().length > 0){
    console.log('Sites already on board. Reset before.');
    return;
  }
  var files = $('#files')[0].files;
  load(files, sites, Polygon_UI, 'red');
}
function loadPolygon(evt){
  if(polygon.get().length>0){
    console.log('Polygon already on board. Reset before.');
    return;
  }
  var files = $('#PolygonFile')[0].files;
  if(files.length > 0 && files[0].type.match("text/*")){
    polygon.enable();
    load(files, polygon, Voronoi_UI, 'blue');
  } else {
    console.log('Not Enable');
  }
}
$('#Load').click(loadSites);
$('#LoadPolygon').click(loadPolygon);
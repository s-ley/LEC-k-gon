import { Main } from "./main.js";

function load(files, collection, add_name){
  if(files.length <= 0) return new Promise((resolve,reject)=>resolve('Empty'));

  var f = files[0];
  if(!f.type.match("text/*")) return new Promise((resolve,reject)=>resolve('Empty'));

  return new Promise((resolve, reject)=>{
    var reader = new FileReader();
    reader.onload = (function(theFile) {
      return function(e) {
        var content = e.target.result.split(/\s+/).map(parseFloat);
        for(var i = 0; i+1<content.length; i+=2){
          collection[add_name](content[i], content[i+1]);
        }
        Main.board.update_bounding_box();
        resolve('Done');
      };
    })(f);
    reader.readAsText(f);
  });
}

export const FileLoader = {
  load: load
}
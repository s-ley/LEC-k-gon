// Configuration options
var eps = 1;

// Jsxgraph global variables
var points = [];
var board = null;
var line_start = null;

// Set for points
var lines = {};
function add(o, x, y, l){
  if (!o[x]) o[x] = {};
    o[x][y] = l;
}
function has(o, x, y){
  return !!(o[x] && o[x][y]);
}
function get(o, x, y){
  return o[x][y];
}
function del(o, x, y) {
  if (!o[x]) return;
  delete o[x][y];
}

// Creating lines by point clicking
function reset_line_creator(){
  points[line_start].setAttribute({fillColor:'#ff0000'});
  line_start = null;
}
var line_creator = function(e){
  if(line_start === null){
    line_start = this.index;
    this.setAttribute({"fillColor": '#0000ff'});
  } else if(line_start === this.index){
    reset_line_creator();
  } else {
    var idx1 = Math.min(this.index, line_start), idx2 = Math.max(this.index, line_start);
    if(has(lines, idx1, idx2)){
      board.removeObject(get(lines, idx1, idx2));
      del(lines, idx1, idx2);
      reset_line_creator();
    } else {
      var line = board.create('line',[points[idx1],points[idx2]], {straightFirst:false, straightLast:false, strokeWidth:2, dash:1});
      add(lines, idx1, idx2, line);
      reset_line_creator();
    }
  }
}

// Create points by clicking
var getMouseCoords = function(e, i) {
  var cPos = board.getCoordsTopLeftCorner(e, i),
      absPos = JXG.getPosition(e, i),
      dx = absPos[0]-cPos[0],
      dy = absPos[1]-cPos[1];
  return new JXG.Coords(JXG.COORDS_BY_SCREEN, [dx, dy], board);
}
var down = function(e) {
  var canCreate = true, i, coords, el;
  if (e[JXG.touchProperty]) {
      i = 0;
  }
  coords = getMouseCoords(e, i);
  for (el in board.objects) {
      if(JXG.isPoint(board.objects[el]) && board.objects[el].hasPoint(coords.scrCoords[1], coords.scrCoords[2])) {
          canCreate = false;
          break;
      }
  }
  if (canCreate) {
    var p = board.create('point', [coords.usrCoords[1], coords.usrCoords[2]]);
    p.index = points.length;
    points.push(p);
    p.on('up', line_creator);
  }
};

function reset(){
  points.map(a => board.removeObject(a));
  points = [];
}

// Load File
function loadFile(evt) {
  var files = $('#files')[0].files; // FileList object

  // files is a FileList of File objects. List some properties.
  for (var i = 0, f; f = files[i]; i++) {
    if(!f.type.match("text/*"))
      continue;
    
    reset();
    
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
        minx -= eps;
        maxx += eps;
        miny -= eps;
        maxy += eps;
        var bb = [minx, maxy, maxx, miny];
        
        
        JXG.JSXGraph.freeBoard(board);
        board = JXG.JSXGraph.initBoard('box', {boundingbox: bb, axis:true});
        board.on('down', down);

        for(var i = 0; i+1<content.length; i+=2){
          var p = board.create('point', [content[i], content[i+1]]);
          p.index = points.length;
          points.push(p);
          p.on('up', line_creator);
        }
        
        /* console.log(board.attr);
        board.attr.boundingbox[0] = minx;
        board.attr.boundingbox[1] = maxy;
        board.attr.boundingbox[2] = maxx;
        board.attr.boundingbox[3] = miny;
        console.log(board.attr); */
        //board.setAttribute({boundingbox: bb})
      };
    })(f);
    // Read in the image file as a data URL.
    reader.readAsText(f);
  }
}
$('#Load').click(loadFile);

// Set everything up
$( document ).ready(function() {
  board = JXG.JSXGraph.initBoard('box', {boundingbox: [-3, 3, 3, -3], axis:true});
  board.on('down', down);
});
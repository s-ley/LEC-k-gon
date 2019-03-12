// Configuration options
var eps;

// Jsxgraph global variables
var points = [];
var board = null;

var line_start = null;

// Set for points
var lines = {};
var line_list = [];
function add(o, x, y, l){
  if (!o[x]) o[x] = {};
  if(!o[x][y]){
    o[x][y] = l;
    line_list.push(l);
  }
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

function add_line(a, b){
  var idx1 = Math.min(a, b), idx2 = Math.max(a, b);
  if(!has(lines, idx1, idx2)){
    var line = board.create('line',[points[idx1],points[idx2]], {straightFirst:false, straightLast:false, strokeWidth:1, dash:1});
    add(lines, idx1, idx2, line);
  }
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
      var line = board.create('line',[points[idx1],points[idx2]], {straightFirst:false, straightLast:false, strokeWidth:1, dash:1});
      add(lines, idx1, idx2, line);
      reset_line_creator();
    }
  }
}

function add_point(x, y, fillColor){
  var p = board.create('point', [x, y], {size: 2, name:'', face:'<>', color: fillColor});
  p.index = points.length;
  points.push(p);
  p.on('up', line_creator);
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
    add_point(coords.usrCoords[1], coords.usrCoords[2], 'blue');
  }
};

function reset(){
  /* line_list.map(a => board.removeObject(a));
  points.map(a => board.removeObject(a)); */
  line_list = [];
  points = [];
  lines = {};
}
function create_board(bb){
  eps = Math.max(bb[1]-bb[3], bb[2]-bb[0])*0.1;
  bb[0] -= eps; bb[1] += eps; bb[2] += eps; bb[3] -= eps;
  board = JXG.JSXGraph.initBoard('box', {boundingbox: bb, axis:true});
  board.on('down', down);
}
function delete_board(){
  reset();
  JXG.JSXGraph.freeBoard(board);
}

function generate_delaunay(){
  if(points.length < 3)
    return;

  var vertices = points.map((p,i) => new delaunay.Vertex(p.coords.usrCoords[1], p.coords.usrCoords[2], i));

  var triangles = delaunay.triangulate(vertices);

  triangles.map(t => {
    add_line(t.v0.idx, t.v1.idx);
    add_line(t.v0.idx, t.v2.idx);
    add_line(t.v1.idx, t.v2.idx);
  });
}

export const data = {
  create_board: create_board, 
  delete_board: delete_board, 
  add_point: add_point,
  reset: reset,
  generate_delaunay: generate_delaunay
};
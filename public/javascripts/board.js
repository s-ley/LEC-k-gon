var eps;
// Set for logic of lines drawn
var lines = {};
function add(o, x, y, l){if (!o[x]) o[x] = {};if(!o[x][y]){o[x][y] = l;}}
function has(o, x, y){return !!(o[x] && o[x][y]);}
//function get(o, x, y){return o[x][y];}
//function del(o, x, y) {if (!o[x]) return;delete o[x][y];}
// Points drawn
var points = [];

// Board and drawing functions
var board_ref = null;
function create_board(bb){
    eps = Math.max(bb[1]-bb[3], bb[2]-bb[0])*0.1;
    bb[0] -= eps; bb[1] += eps; bb[2] += eps; bb[3] -= eps;
    board_ref = JXG.JSXGraph.initBoard('box', {boundingbox: bb, axis:true});
    // Board events
    //    board_ref.on('down', down);
}
// p1 and p2 must have .idx field
// width and dash are numbers
function draw_segment(p1, p2, width, dash){
    var idx1 = Math.min(p1.idx, p2.idx), idx2 = Math.max(p1.idx, p2.idx);
    if(!has(lines, idx1, idx2)){
        var line = board_ref.create('line',[points[idx1],points[idx2]], {straightFirst:false, straightLast:false, strokeWidth:width, dash:dash});
        add(lines, idx1, idx2, line);
    }
    //console.log(`(${idx1},${idx2})`);
}
function draw_point(x, y, fillColor){
    var p = board_ref.create('point', [x, y], {size: 2, name:`${points.length}`, face:'<>', color: fillColor});
    p.idx = points.length;
    points.push(p);
    return p;
}
function reset_board(bb){
    points = [];
    lines = {};
    
    JXG.JSXGraph.freeBoard(board_ref);
    create_board(bb);
}
function get_points(){
    return points;
}

export const board = {
    init: create_board,
    add_point: draw_point,
    add_segment: draw_segment,
    reset: reset_board,
    get_points: get_points
};
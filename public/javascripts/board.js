import { polygon } from "./polygon.js";
import {Voronoi_UI} from './UI/voronoi_ui.js';

var eps;
// Set for logic of lines drawn
var lines = {};
function add(o, x, y, l){if (!o[x]) o[x] = {};if(!o[x][y]){o[x][y] = l;}}
function has(o, x, y){return !!(o[x] && o[x][y]);}
//function get(o, x, y){return o[x][y];}
//function del(o, x, y) {if (!o[x]) return;delete o[x][y];}

// Points drawn
var points = [];
var boundingbox = [0,0,0,0];

// Create points by clicking
var getMouseCoords = function(e, i) {
    var cPos = board_ref.getCoordsTopLeftCorner(e, i),
    absPos = JXG.getPosition(e, i),
    dx = absPos[0]-cPos[0],
    dy = absPos[1]-cPos[1];
    return new JXG.Coords(JXG.COORDS_BY_SCREEN, [dx, dy], board_ref);
}
var click_event = function(e) {
    var canCreate = true, i, coords, el;
    if (e[JXG.touchProperty]) {
        i = 0;
    }
    coords = getMouseCoords(e, i);
    for (el in board_ref.objects) {
        if(JXG.isPoint(board_ref.objects[el]) && board_ref.objects[el].hasPoint(coords.scrCoords[1], coords.scrCoords[2])) {
            canCreate = false;
            break;
        }
    }
    if (canCreate) {
        polygon.add(coords.usrCoords[1], coords.usrCoords[2], 'blue');
    }
};


// Board and drawing functions
var board_ref = null;
function set_bounding_box(){
    var bb = boundingbox;
    eps = Math.max(Math.max(bb[1]-bb[3], bb[2]-bb[0])*0.2, 10);
    bb[0] -= eps; bb[1] += eps; bb[2] += eps; bb[3] -= eps;
    board_ref.setBoundingBox(bb);
}
function create_board(bb){
    boundingbox = bb;
    board_ref = JXG.JSXGraph.initBoard('box', {boundingbox: bb, axis:false });
    set_bounding_box();
    // Board events
    board_ref.on('down', click_event);
}


// p1 and p2 must have .idx field
// width and dash are numbers
function draw_segment(p1, p2, width, dash, color, halfEdge){
    var idx1 = Math.min(p1.idx, p2.idx), idx2 = Math.max(p1.idx, p2.idx);
    if(!has(lines, idx1, idx2)){
        var line = board_ref.create('line',[points[p1.idx],points[p2.idx]], {straightFirst:false, straightLast:false, strokeWidth:width, dash:dash, strokeColor: color});
        if(halfEdge){
            line.halfEdge = halfEdge;
            line.on('up', function(e){
                Voronoi_UI.dcel(this.halfEdge);
            });
        }
        
        add(lines, idx1, idx2, line);
    }
}
function draw_point(x, y, fillColor){
    var p = board_ref.create('point', [x, y], {size: 2, name:`${points.length}`, face:'<>', color: fillColor, fixed: true});
    p.idx = points.length;
    points.push(p);
    if(p.coords.usrCoords[1] < boundingbox[0] || p.coords.usrCoords[1] > boundingbox[2] || p.coords.usrCoords[2] < boundingbox[3] || p.coords.usrCoords[2] > boundingbox[1]){
        boundingbox[0] = Math.min(boundingbox[0], p.coords.usrCoords[1]);
        boundingbox[2] = Math.max(boundingbox[2], p.coords.usrCoords[1]);
        boundingbox[3] = Math.min(boundingbox[3], p.coords.usrCoords[2]);
        boundingbox[1] = Math.max(boundingbox[1], p.coords.usrCoords[2]);
        set_bounding_box();
    }
    return p;
}
function draw_circle(vertex,radius,width,color,fillColor){
    var p = board_ref.create('point', [vertex.coords.usrCoords[1]+radius, vertex.coords.usrCoords[2]], {
        size: 2, opacity: 0, fixed: true, name: ''
    });
    var c1 = board_ref.create('circle', [vertex, p], {strokeWidth: width, strokeColor: color});
    return {
        point: p,
        circle: c1
    }
}
function delete_circle(data){
    board_ref.removeObject(data.circle);
    board_ref.removeObject(data.point);
}
function delete_point(p){
    board_ref.removeObject(p);
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
function get_bounding_box(){
    return boundingbox;
}

export const board = {
    init: create_board,
    add_point: draw_point,
    add_segment: draw_segment,
    add_circle: draw_circle,
    remove_circle: delete_circle,
    remove_point: delete_point,
    reset: reset_board,
    get_points: get_points,
    get_bounding_box: get_bounding_box
};
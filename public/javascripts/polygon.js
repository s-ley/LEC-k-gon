import {board} from './board.js';
import {error} from './error.js';

var start = false;
var finished = false;
var polygon_ccw = [];

// TODO:
// Verificar que el poligono sea simple

var line_width = 1;

function reset_list(){
    polygon_ccw = [];
    finished = false;
    $('#Polygon').html('');
    $('#ClosePolygon').css('display', 'block');
}

function close_polygon(){
    if(finished)
        return;

    if(polygon_ccw.length < 3){
        error.change_msg('Error: el polígono debe tener más de 2 vértices.');
        return;
    }
    // Verificar que sea simple

    // Guardar
    var len = polygon_ccw.length;
    board.add_segment(polygon_ccw[len-1], polygon_ccw[0], line_width, 0);
    finished = true;
    $('#ClosePolygon').css('display', 'none');
}

function add_vertex(x,y,fillColor){
    if(finished || !start)
        return;

    // HTML
    $('#Polygon').append(`<li>(${x.toFixed(2)},${y.toFixed(2)})</li>`);

    // storage
    polygon_ccw.push(board.add_point(x,y,fillColor));

    if(polygon_ccw.length>1){
        var len = polygon_ccw.length;
        board.add_segment(polygon_ccw[len-1], polygon_ccw[len-2], line_width, 0);
    }
}

export const polygon = {
    add: add_vertex,
    finish: close_polygon,
    reset: reset_list
}

// HTML Display

$('#ClosePolygon').on('click', close_polygon);

$('#EnablePolygon').on('click', ()=>{
    start = true; 
    $('#DisablePolygon').css('display', 'block'); 
    $('#EnablePolygon').css('display', 'none');
});
$('#DisablePolygon').on('click', ()=>{
    start = false; 
    $('#DisablePolygon').css('display', 'none'); 
    $('#EnablePolygon').css('display', 'block');
});
$('#DisablePolygon').css('display', 'none');
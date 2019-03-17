import {board} from './board.js';
import {error} from './error.js';
import {polygon_examples} from './Examples/polygon_examples.js';
import {Voronoi_UI} from './UI/voronoi_ui.js';

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

function toString(){
    return polygon_ccw.map(s => `${s.coords.usrCoords[1]} ${s.coords.usrCoords[2]}`).join(' ');
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
    board.add_segment(polygon_ccw[len-1], polygon_ccw[0], line_width, 0, 'blue', false);
    finished = true;
    $('#ClosePolygon').css('display', 'none');
    $('#DownloadPolygon').html($(`<a href="data:text/plain;charset=utf-8,${toString()}" download="polygon.txt">Descarga el Polígono</a>`));
}

function add_vertex(x,y,fillColor){
    if(finished || !start)
        return;

    // HTML
    $('#Polygon').append(`<li>(${x.toFixed(2)},${y.toFixed(2)}). Id: <strong>${board.get_points().length}</strong></li>`);

    // storage
    polygon_ccw.push(board.add_point(x,y,fillColor));

    if(polygon_ccw.length>1){
        var len = polygon_ccw.length;
        board.add_segment(polygon_ccw[len-1], polygon_ccw[len-2], line_width, 0, 'blue', false);
    }
}
function get_vertex_list(){
    return polygon_ccw;
}
function enable_add(){
    start = true;
}
function disable_add(){
    start = false;
}

export const polygon = {
    add: add_vertex,
    finish: close_polygon,
    reset: reset_list,
    get: get_vertex_list,
    enable: enable_add,
    disable: disable_add
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
function load_example(num){
    if(polygon_ccw.length>0){
        return;
    }
    enable_add();
    for(var i = 0; i+1<polygon_examples[num].length; i+=2){
        add_vertex(polygon_examples[num][i], polygon_examples[num][i+1], 'blue');
    }
    close_polygon();
    Voronoi_UI.show();
}
polygon_examples.map((arr,i) => {
    $(`.Polygon .Examples .${i+1}`).on('click', ()=>{
        load_example(i);
    });
});

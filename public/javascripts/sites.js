import {board} from './board.js';
import { algorithms } from "./algorithms.js";

var site_list = [];

function toString(){
    return site_list.map(s => `${s.coords.usrCoords[1]} ${s.coords.usrCoords[2]}`).join(' ');
}

function add_site(x, y, fillColor){
    // HTML
    $('#Sites').append(`<li>(${x.toFixed(2)},${y.toFixed(2)})</li>`);

    // storage    
    site_list.push(board.add_point(x,y,fillColor));

    // TODO Better verification
    if(site_list.length >= 3){
        $('#Delaunay').css('display', 'block');
        $('#Download').html($(`<a href="data:text/plain;charset=utf-8,${toString()}" download="points.txt">Download Sites</a>`))
    }
}

function remove_all_sites(){
    site_list = [];
    // Reset html list
    $('#Sites').html("");
}
function get_all_sites(){
    return site_list;
}
// Ready for voronoi or delaunay
function enough(){
    return site_list.length >= 3;
}

export const sites = {
    add: add_site,
    get: get_all_sites,
    reset: remove_all_sites,
    valid: enough
}

// HTML Display

$('#Delaunay').css('display', 'none');
var line_width = 1;
$('#Delaunay').on('click', ()=>{
    var external_delaunay_edge = algorithms.delaunay(get_all_sites());

    // Print in screen
    var triangles = algorithms.get_faces(external_delaunay_edge);

    var dash = 1;

    triangles.map(t => {
        board.add_segment(t[0], t[1], line_width, dash, 'blue');
        board.add_segment(t[2], t[1], line_width, dash, 'blue');
        board.add_segment(t[2], t[0], line_width, dash, 'blue');
    });
});

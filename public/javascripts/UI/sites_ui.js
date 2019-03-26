import { UI } from './UI.js';
import { sites_examples } from '../Examples/sites_examples.js';
import { Main } from '../main.js';
import { FileLoader } from '../file_loader.js';
import { Vector } from '../vector_functions.js';

function show_section(){
    $('.Sites').css('display', 'block');
}
function hide_section(){
    $('.Sites').css('display', 'none');
}
function add_site(x, y, id){
    $('.Sites .SitesList').append(`<li><strong>${id}</strong> . (${x.toFixed(2)}, ${y.toFixed(2)})</li>`);
}
function reset_list(){
    $('.Sites .SitesList').html("");
}
function download_sites(str){
    $('.Sites .Download').html($(`<a href="data:text/plain;charset=utf-8,${str}" download="points.txt">Descarga los sitios</a>`));
    $('.Sites .Reset').css('display', 'block');
}
function hide_download(){
    $('.Sites .Download').html('');
    $('.Sites .Reset').css('display', 'none');
}
function show_generators(){
    $('.Sites .Generator').css('display', 'block');
}
function hide_generators(){
    $('.Sites .Generator').css('display', 'none');
}

export const Sites_UI = {
    show: show_section,
    hide: hide_section,
    list_add: add_site,
    list_reset: reset_list,
    show_download: download_sites,
    hide_download: hide_download,
    show_generators: show_generators,
    hide_generators: hide_generators
}

var open = false;
// Menu button
$('#ShowSite').on('click', function(e){
    if(!open){
        show_section();
        open = true;
    } else {
        hide_section();
        open = false;
    }
    $('#ShowSite img').toggleClass('Flip');
});
// Reset
$('.Sites .Reset').on('click', function(e){
    Main.lec.delete_from_board();
    Main.voronoi.delete_from_board();
    Main.delaunay.delete_from_board();
    Main.sites.delete_from_board();
});
// File generation 
$('.Sites .LoadFile').on('click', function(e){
    var files = $('.Sites .files');
    if(files && files[0] && files[0].files) FileLoader.load(files[0].files, Main.sites, "add_site");
});
// Random generation
var numPoints = 10;
var minx = -50, maxx = 50;
var miny = -50, maxy = 50;
$('.Sites .Random input')[0].value = `${numPoints}`;
$('.Sites .Random span').text(numPoints);
$('.Sites .Random input').on('input propertychange', (e) => {
    $('.Sites .Random span').text(e.target.value);
    numPoints = e.target.value;
});
$('.Sites .Random button').on('click', (e) => {
    if(Main.sites.get_vertices().length > 0){
        return;
    }
    var i;
    for(i=0;i<numPoints;i++){
        var p = {
            x: Math.random()*(maxx-minx)+minx,
            y: Math.random()*(maxy-miny)+miny
        }
        Main.sites.add_site(p.x, p.y);
    }
    Main.board.update_bounding_box();
});
// Examples
sites_examples.map((arr,i) => {
    $(`.Sites .Examples .${i+1}`).on('click', ()=>{
        Main.sites.load_example(i);
    });
});
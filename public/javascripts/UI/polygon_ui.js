import {UI} from './UI.js';
import { Main } from '../main.js';
import { polygon_examples } from '../Examples/polygon_examples.js';
import { FileLoader } from '../file_loader.js';

function show_section(){
    UI.clear();
    $('.Polygon').css('display', 'block');
}
function hide_section(){
    $('.Polygon').css('display', 'none');
}
function add_vertex(x, y, id){
    $('.Polygon .PolygonList').append(`<li><strong>${id}</strong> . (${x.toFixed(2)}, ${y.toFixed(2)})</li>`);
    $('.Polygon .Automatic').css('display', 'none');
}
function reset_list(){
    $('.Polygon .PolygonList').html("");
    $('.Polygon .Automatic').css('display', 'block');
    $('.Polygon .Enable').css('display', 'block');
    $('.Polygon .Disable').css('display', 'none');
}
function download_polygon(str){
    $('.Polygon .Download').html($(`<a href="data:text/plain;charset=utf-8,${str}" download="points.txt">Descarga los sitios</a>`));
    $('.Polygon .Reset').css('display', 'block');
}
function hide_download(){
    $('.Polygon .Download').html('');
    $('.Polygon .Reset').css('display', 'none');
}
function show_generators(){
    $('.Polygon .Generator').css('display', 'block');
    $('.Polygon .Reset').css('display', 'none');
}
function hide_generators(){
    $('.Polygon .Generator').css('display', 'none');
    $('.Polygon .Reset').css('display', 'block');
}
export const Polygon_UI = {
    show: show_section,
    hide: hide_section,
    list_add: add_vertex,
    list_reset: reset_list,
    show_download: download_polygon,
    hide_download: hide_download,
    show_generators: show_generators,
    hide_generators: hide_generators,
}
polygon_examples.map((arr,i) => {
    $(`.Polygon .Examples .${i+1}`).on('click', ()=>{
        Main.polygon.load_example(i);
    });
});
// File generation 
$('.Polygon .LoadFile').on('click', function(e){
    var files = $('.Polygon .files');
    if(files && files[0] && files[0].files){
        var promise = FileLoader.load(files[0].files, Main.polygon, "add_vertex");
        promise.then(()=>Main.polygon.close());
    }
});
$('.Menu #ShowPolygon').on('click', function(e){
    show_section();
});
$('.Polygon .Manual .Enable').on('click', function(e){
    Main.polygon.enable_manual();
    $('.Polygon .Manual .Enable').css('display', 'none');
    $('.Polygon .Manual .Disable').css('display', 'block');
});
$('.Polygon .Manual .Disable').on('click', function(e){
    Main.polygon.disable_manual();
    $('.Polygon .Manual .Enable').css('display', 'block');
    $('.Polygon .Manual .Disable').css('display', 'none');
});
$('.Polygon .Manual .Close').on('click', function(e){
    Main.polygon.close();
});
$('.Polygon .Reset').on('click', function(e){
    Main.polygon.delete_from_board();
    Main.voronoi.delete_from_board();
});

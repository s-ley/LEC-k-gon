import {UI} from './UI.js';
import { Main } from '../main.js';

// Helper functions
function show_generator(){
    $('.Voronoi .Generator').css('display', 'block');
}
function hide_generator(){
    $('.Voronoi .Generator').css('display', 'none');
}
function show_section(){
    $('.Voronoi').css('display', 'block');
}
function hide_section(){
    $('.Voronoi').css('display', 'none');
}
function show_dcel_edge(dcel_edge){
    var content = $('<div></div>');
    var actual = $('<p></p>');
    var prev = '';
    if(dcel_edge.prev !== null) prev = $(`<span>${dcel_edge.prev.to_html()}</span>`).addClass('clickable');
    var curr = $(`<span>${dcel_edge.to_html()}</span>`);
    var next = '';
    if(dcel_edge.next != null) next = $(`<span>${dcel_edge.next.to_html()}</span>`).addClass('clickable');
    var twin_p = $('<p><span>Twin: <Span></p>');
    var twin = $(`<span>${dcel_edge.twin.to_html()}</span>`).addClass('clickable');

    if(dcel_edge.data.collection !== null){
        if(dcel_edge.prev !== null){
            prev.on('click', ()=>{
                dcel_edge.data.collection.select_edge(dcel_edge.prev);
            });
        }
        if(dcel_edge.next !== null){
            next.on('click', ()=>{
                dcel_edge.data.collection.select_edge(dcel_edge.next);
            });
        }
        twin.on('click', ()=>{
            dcel_edge.data.collection.select_edge(dcel_edge.twin);
        });
    }
    twin_p.append(twin);
    actual.append(prev); actual.append(' . '); actual.append(curr); actual.append(' . '); actual.append(next);
    content.append(actual);
    content.append(twin_p);
    $('.Voronoi .DCEL').html(content);
}
function hide_dcel_edge(){
    $('.Voronoi .DCEL').html('');
}

export const Voronoi_UI = {
    show: show_section,
    hide: hide_section,
    show_edge: show_dcel_edge,
    hide_edge: hide_dcel_edge,
}
// Menu button
var open = false;
$('#ShowVoronoi').on('click', ()=>{
    if(!open){
        show_section();
        open = true;
    } else {
        hide_section();
        open = false;
    }
    $('#ShowVoronoi img').toggleClass('Flip');
});
$('.Voronoi .Generator button').on('click', function(e){
    Main.voronoi.build();
});
$('.Voronoi .Reset button').on('click', function(e){
    Main.lec.delete_from_board();
    Main.voronoi.delete_from_board();
});
import { UI } from './UI.js';
import { Main } from '../main.js';

function show_section(){
    UI.clear();
    $('.Data .Delaunay').css('display', 'block');
}
function hide_section(){
    $('.Data .Delaunay').css('display', 'none');
}
function show_dcel_edge(dcel_edge){
    var content = $('<div></div>');
    var actual = $('<p></p>');
    var prev = $(`<span>${dcel_edge.prev.to_html()}</span>`).addClass('clickable');
    var curr = $(`<span>${dcel_edge.to_html()}</span>`);
    var next = $(`<span>${dcel_edge.next.to_html()}</span>`).addClass('clickable');
    var twin_p = $('<p><span>Twin: <Span></p>');
    var twin = $(`<span>${dcel_edge.twin.to_html()}</span>`).addClass('clickable');

    if(dcel_edge.data.collection !== null){
        prev.on('click', ()=>{
            dcel_edge.data.collection.select_edge(dcel_edge.prev);
        });
        next.on('click', ()=>{
            dcel_edge.data.collection.select_edge(dcel_edge.next);
        });
        twin.on('click', ()=>{
            dcel_edge.data.collection.select_edge(dcel_edge.twin);
        });
    }
    twin_p.append(twin);
    actual.append(prev); actual.append(' . '); actual.append(curr); actual.append(' . '); actual.append(next);
    content.append(actual);
    content.append(twin_p);
    $('.Delaunay .DCEL').html(content);
}
function hide_dcel_edge(){
    $('.Delaunay .DCEL').html('');
}
function show_generators(){
    $('.Delaunay .Generator').css('display', 'block');
    $('.Delaunay .Reset').css('display', 'none');
}
function hide_generators(){
    $('.Delaunay .Generator').css('display', 'none');
    $('.Delaunay .Reset').css('display', 'block');
}

export const Delaunay_UI = {
    show: show_section,
    hide: hide_section,
    show_edge: show_dcel_edge,
    hide_edge: hide_dcel_edge,
    show_generators: show_generators,
    hide_generators: hide_generators
}

// Buttons and events
$('.Delaunay .Generate').on('click', ()=>{
    Main.delaunay.build();
});
$('.Menu #ShowDelaunay').on('click', ()=>{
    Delaunay_UI.show();
});
// Reset
$('.Delaunay .Reset').on('click', ()=>{
    Main.delaunay.delete_from_board();
});
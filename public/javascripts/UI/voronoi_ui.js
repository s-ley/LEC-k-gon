import {UI} from './UI.js';
import {sites} from '../sites.js';

function show_generator(){
    $('#Voronoi').css('display', 'block');
}
function hide_generator(){
    $('#Voronoi').css('display', 'none');
}
function halfEdge_to_html(he, prefix){
    if(he)
        return $(`<p>${prefix}HalfEdge: <strong>${he.p1.point_index} -> ${he.p2.point_index}</strong>. Incident Face: ${(he.incident_face)?he.incident_face.point_index:'null'}</p>`);
    return $(`<p>${prefix}HalfEdge: null.</p>`)
}
function dcel_to_html(halfEdge){
    var res = $('<div></div>');
    res.append(halfEdge_to_html(halfEdge, ''));
    res.append(halfEdge_to_html(halfEdge.next, 'Siguiente: '));
    res.append(halfEdge_to_html(halfEdge.prev, 'Anterior: '));
    return res;
}

function show_section(){
    UI.clear();
    $('.Data .Voronoi').css('display', 'block');
    if(sites.valid()){
        show_generator();
    } else {
        hide_generator();
    }
}
function hide_section(){
    $('.Data .Voronoi').css('display', 'none');
}
function display_edge(halfEdge){
    var area = $('.Data .Voronoi .Section .DCEL');
    area.html('');
    area.append(dcel_to_html(halfEdge));
    area.append(dcel_to_html(halfEdge.twin));
}


export const Voronoi_UI = {
    show: show_section,
    hide: hide_section,
    dcel: display_edge
}
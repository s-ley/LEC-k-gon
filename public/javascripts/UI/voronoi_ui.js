import {UI} from './UI.js';

// Helper functions
function show_generator(){
    $('#Voronoi').css('display', 'block');
}
function hide_generator(){
    $('#Voronoi').css('display', 'none');
}
function halfEdge_to_html(he){
    if(he)
        return $(` <strong>${he.p1.point_index} -> ${he.p2.point_index}. </strong>`);
    return $(`<strong>null.</strong>`)
}
function incident_face_to_html(he){
    return `${(he && he.incident_face)?he.incident_face.point_index:'null'}.`;
}
function dcel_to_html(halfEdge){
    var res = $('<p></p>');
    res.append(halfEdge_to_html(halfEdge.prev));
    res.append(halfEdge_to_html(halfEdge));
    res.append(halfEdge_to_html(halfEdge.next));
    res.append('. Incident Faces: ');
    res.append(incident_face_to_html(halfEdge.prev));
    res.append(incident_face_to_html(halfEdge));
    res.append(incident_face_to_html(halfEdge.next));
    return res;
}

function show_section(){
    UI.clear();
    $('.Data .Voronoi').css('display', 'block');
    /* if(sites.valid()){
        show_generator();
    } else {
        hide_generator();
    } */
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
import {polygon} from './polygon.js';
import {voronoi} from './voronoi.js';
import { LEC_UI } from './UI/LEC_ui.js';
import { board } from './board.js';
import {Intersections} from './segments_rays_intersections.js';

var check_end_loop_condition = false;
var step = 0;
var polygon_DCEL = null, voronoi_DCEL = null;
var circle_radius = 0;
// RESULT
var largest_empty_circle_radius = 0;
var largest_empty_circle_center = null;
// BOARD
var largest_empty_circle = null;
var largest_empty_circle_point = null;
var polygon_vertex_circle = null;
var polygon_edge = null;
var polygon_first_edge = null;
var polygon_edge_circles = {
    st: null,
    ed: null
}
var voronoi_edge = null;
var voronoi_edge_circles = {
    st: null,
    ed: null
}
var voronoi_vertices_circles = [];

var current_face = null;
var site_circle = null;
var intersection_point = null;
var intersection_circle = null;
// Step 0-1
// Elegir una arista del poligono y marcarla
function start(){
    polygon_DCEL = polygon.DCEL();
    voronoi_DCEL = voronoi.get();
    if(polygon_DCEL.vertices.length <= 2 || voronoi_DCEL.edges.length === 0){
        return;
    }
    var bb = board.get_bounding_box();
    var mx = Math.max(bb[2]-bb[0], bb[1]-bb[3]);
    circle_radius = mx/70;
    step = 1;
    // Elegir una arista del poligono y marcarla
    polygon_edge = polygon_DCEL.edges[0];
    polygon_first_edge = polygon_edge;
    polygon_edge_circles.st = board.add_circle(board.get_points()[polygon_edge.p1.point_index], circle_radius, 1, 'blue', '#fff');
    polygon_edge_circles.ed = board.add_circle(board.get_points()[polygon_edge.p2.point_index], circle_radius, 1, 'blue', '#fff');
}
// Step 1-2
// Encontrar sitio mas cercano
function step_1(){
    var bb = board.get_bounding_box();
    var inf = Math.max(bb[2]-bb[0], bb[1]-bb[3]);
    var best_distance = inf;
    var best_site = voronoi_DCEL.faces[0];
    for(var i = 0; i<voronoi_DCEL.faces.length; i++){
        var dis = distance(board.get_points()[polygon_edge.p1.point_index], board.get_points()[voronoi_DCEL.faces[i].point_index]);
        if(dis < best_distance){
            best_distance = dis;
            best_site = voronoi_DCEL.faces[i];
        }
    }
    site_circle = board.add_circle(board.get_points()[best_site.point_index], circle_radius, 1, 'red', '#fff');
    current_face = best_site;
    step = 2;
}
// Step 2-3
// Encontrar la arista que intersecta el rayo
function step_2(){
    var edge = current_face.incident_edge;
    var ray = polygon_edge;
    while(!Intersections.segment_ray_intersects(edge, ray)){
        edge = edge.next;
    }
    voronoi_edge = edge;
    voronoi_edge_circles.st = board.add_circle(board.get_points()[voronoi_edge.p1.point_index], circle_radius, 1, 'green', '#fff');
    voronoi_edge_circles.ed = board.add_circle(board.get_points()[voronoi_edge.p2.point_index], circle_radius, 1, 'green', '#fff');
    step = 3;
}
// Loop
function condition_1(){
    if(!Intersections.segment_ray_intersects(voronoi_edge, polygon_edge)){
        next_voronoi_edge();
        step = 6;
    } else {
        step = 7;
    }
}
function condition_2(){
    if(Intersections.segment_ray_intersects(voronoi_edge, polygon_edge) && !Intersections.semgent_segment_intersects(voronoi_edge, polygon_edge)){
        show_polygon_vertex_circle();
        step = 8;
    } else {
        step = 10;
    }
}
function search_intersection(){
    voronoi_edge.number_of_intersections += 1;
    voronoi_edge.twin.number_of_intersections += 1;
    var inter = Intersections.lines_intersection(polygon_edge, voronoi_edge);
    intersection_point = board.add_point(inter.x, inter.y, 'purple');
    var radius = distance(intersection_point, board.get_points()[current_face.point_index]);
    intersection_circle = board.add_circle(intersection_point, radius, 1, 'purple', '#fff');
    if(radius > largest_empty_circle_radius){
        largest_empty_circle_radius = radius;
        largest_empty_circle_center = inter;
    }
    step += 1;
}
function move_to_adyacent_voronoi_region(){
    // clean previous data
    board.remove_circle(intersection_circle);
    board.remove_point(intersection_point);
    intersection_circle = null;
    intersection_point = null;
    // Move
    board.remove_circle(site_circle);
    // Change and move
    voronoi_edge = voronoi_edge.twin.next;
    current_face = voronoi_edge.incident_face;
    board.remove_circle(voronoi_edge_circles.ed);
    voronoi_edge_circles.ed = board.add_circle(board.get_points()[voronoi_edge.p2.point_index], circle_radius, 1, 'green', '#fff');
    site_circle = board.add_circle(board.get_points()[voronoi_edge.incident_face.point_index], circle_radius, 1, 'red', '#fff');
    step += 1;
}
function next_voronoi_edge(){
    voronoi_edge = voronoi_edge.next;
    board.remove_circle(voronoi_edge_circles.st);
    voronoi_edge_circles.st = voronoi_edge_circles.ed;
    voronoi_edge_circles.ed = board.add_circle(board.get_points()[voronoi_edge.p2.point_index],circle_radius,1,'green','#fff');
}
function next_polygon_edge(){
    polygon_edge = polygon_edge.next;

    board.remove_circle(polygon_vertex_circle);
    board.remove_circle(polygon_edge_circles.st);
    polygon_vertex_circle = null;
    polygon_edge_circles.st = polygon_edge_circles.ed;
    polygon_edge_circles.ed = board.add_circle(board.get_points()[polygon_edge.p2.point_index],circle_radius,1,'blue','#fff');
    check_end_loop_condition = true;
    step += 1;
}
function show_polygon_vertex_circle(){
    var radius = distance(board.get_points()[polygon_edge.p2.point_index], board.get_points()[current_face.point_index]);
    polygon_vertex_circle = board.add_circle(board.get_points()[polygon_edge.p2.point_index],radius,1,'purple','#fff');
    if(radius > largest_empty_circle_radius){
        largest_empty_circle_radius = radius;
        largest_empty_circle_center = polygon_edge.p2;
    }
}
function restart_loop(){
    step = 4;
}
// Default
function log_step(){
    console.log(step);
    step += 1;
}
// Helper function
function distance(board_point1, board_point2){
    var dx = board_point2.coords.usrCoords[1] - board_point1.coords.usrCoords[1];
    var dy = board_point2.coords.usrCoords[2] - board_point1.coords.usrCoords[2];
    return Math.sqrt(dx*dx+dy*dy);
}
function clear_little_circles(){
    board.remove_circle(site_circle);
    board.remove_circle(polygon_edge_circles.st);
    board.remove_circle(polygon_edge_circles.ed);
    board.remove_circle(voronoi_edge_circles.st);
    board.remove_circle(voronoi_edge_circles.ed);
    site_circle = null;
    polygon_edge_circles = {st: null, ed: null};
    voronoi_edge_circles = {st: null, ed: null};
}
function loop_end_condition(){
    if(check_end_loop_condition && polygon_first_edge.equals(polygon_edge)){
        clear_little_circles();
        step = 13;
    } else {
        step += 1;
    }
}

function search_voronoi_vertices(){
    var edge = voronoi_DCEL.outside_face.incident_edge;
    var queue = [{e:edge, inside: false}];
    var index = 0;
    var inside;
    do {
        var curr = queue[index++];
        curr.e.dfs_visited = true;
        if(curr.inside && curr.e.incident_face.point_index !== -1){
            // Show circle
            var radius = distance(board.get_points()[curr.e.p1.point_index], board.get_points()[curr.e.incident_face.point_index]);
            voronoi_vertices_circles.push(board.add_circle(board.get_points()[curr.e.p1.point_index],radius,1,'purple','#fff'));
            if(radius > largest_empty_circle_radius){
                largest_empty_circle_radius = radius;
                largest_empty_circle_center = curr.e.p1;
            }
        }
        
        // Add next, twin
        inside = (curr.e.number_of_intersections%2 === 1)? !curr.inside : curr.inside;
        if(!curr.e.next.dfs_visited){
            queue.push({e:curr.e.next, inside: inside});
        }
        if(!curr.e.twin.dfs_visited){
            queue.push({e:curr.e.twin, inside: inside});
        }
    } while(index < queue.length);
    step += 1;
}
function show_largest_empty_circle(){
    voronoi_vertices_circles.map(c => board.remove_circle(c));
    voronoi_vertices_circles = [];
    largest_empty_circle_point = board.add_point(largest_empty_circle_center.x, largest_empty_circle_center.y, 'purple');
    largest_empty_circle = board.add_circle(largest_empty_circle_point, largest_empty_circle_radius, 1, 'purple', '#fff');
    step += 1;
}

// Construction
function UI_obj(str1, str2, str3, f){
    return {t1: str1, t2: str2, t3: str3, action: f};
}
var UI_DATA = [
    UI_obj('Iniciar', '', '', start),
    UI_obj('Elegir una arista cualquiera del polígono (circulos azules)', '', '', step_1),
    UI_obj('Encontrar el sitio más cercano (circulo rojo)', '', '', step_2),
    UI_obj('Encontrar la arista (circulos verdes) que intersecta el rayo (azul), revisar todas las de la región', '', '',log_step),
    UI_obj('Ciclo:','','',loop_end_condition),
    UI_obj('Ciclo:','Si el rayo no intersecta a la arista seleccionada', '', condition_1),
    UI_obj('Ciclo:','Si el rayo no intersecta a la arista seleccionada','Ir a la siguiente arista en el DCEL del diagrama de voronoi',restart_loop),
    UI_obj('Ciclo:','Si el rayo intersecta pero el segmento no','',condition_2),
    UI_obj('Ciclo:','Si el rayo intersecta pero el segmento no','Revisar el círculo centrado en el vértice de voronoi del final',next_polygon_edge),
    UI_obj('Ciclo:','Si el rayo intersecta pero el segmento no','Ir a la siguiente arista del polígono',restart_loop),
    UI_obj('Ciclo:','Si los segmentos se intersectan','',search_intersection),
    UI_obj('Ciclo:','Si los segmentos se intersectan','Revisar el círculo centrado en la intersección e incrementar el número de intersecciones de la arista de voronoi.',move_to_adyacent_voronoi_region),
    UI_obj('Ciclo:','Si los segmentos se intersectan','Cambiar a la región de voronoi adyacente (Usando twin del DCEL)',restart_loop),
    UI_obj('Termina el ciclo al darle una vuelta al polígono.', '', '', search_voronoi_vertices),
    UI_obj('Revisar los vertices de voronoi dentro del polígono', 'Se hace un DFS', 'Se determina cuales estan dentro usando el número de intersecciones de las aristas de voronoi', show_largest_empty_circle),
    UI_obj('Resultado:', 'Mayor círculo vacío con centro restringido al polígono','',log_step)

];

function finished(){
    return step >= UI_DATA.length;
}
function next_step(){
    if(finished()){
        if(interval !== null){
            clearInterval(interval);
            interval = null;
        }
        return;
    }
    UI_DATA[step].action();
    if(!finished())
        LEC_UI.change_text(UI_DATA[step].t1, UI_DATA[step].t2, UI_DATA[step].t3);
}

export const LEC = {
    next: next_step,
}

var interval = null;
$('.LEC .Controls .Play').on('click', function(e){
    if(interval === null && !finished()){
        interval = setInterval(next_step, 200);
    }
});
$('.LEC .Controls .Pause').on('click', function(e){
    if(interval !== null){
        clearInterval(interval);
        interval = null;
    }
});
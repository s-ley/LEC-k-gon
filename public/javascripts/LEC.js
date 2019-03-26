import { Intersections } from "./segments_rays_intersections.js";
import { VertexData, Vertex } from "./data_structures/DCEL.js";
import Queue from "./data_structures/queue.js";

function distance(dcel_vertex_1, dcel_vertex_2){
    var dx = dcel_vertex_2.x - dcel_vertex_1.x;
    var dy = dcel_vertex_2.y - dcel_vertex_1.y;
    return Math.sqrt(dx*dx+dy*dy);
}

export default class LEC{
    UI_obj(str1, str2, str3, f){
        return {t1: str1, t2: str2, t3: str3, action: f};
    }
    constructor(polygon, voronoi, LEC_UI = null, board_ref = null){
        this.next = this.next.bind(this);
        this.play = this.play.bind(this);
        this.pause = this.pause.bind(this);
        this.delete_from_board = this.delete_from_board.bind(this);
        this.polygon = polygon;
        this.voronoi = voronoi;
        this.UI = LEC_UI;
        this.board = board_ref;
        this.circle_radius = 0;
        this.circle_stroke_width = 1;
        this.interval = null;
        this.UI_DATA = [
            this.UI_obj('Iniciar', '', '', this.start.bind(this)),
            this.UI_obj('Elegir una arista cualquiera del polígono (circulos azules)', '', '', this.closest_site.bind(this)),
            this.UI_obj('Encontrar el sitio más cercano (circulo rojo)', '', '', this.intersecting_edge.bind(this)),
            this.UI_obj('Encontrar la arista (circulos verdes) que intersecta el rayo (azul), revisar todas las de la región', '', '',this.do_nothing.bind(this)),
            this.UI_obj('Ciclo:','','',this.while_condition.bind(this)),
            this.UI_obj('Ciclo:','Si el rayo no intersecta a la arista seleccionada', '', this.condition_1.bind(this)),
            this.UI_obj('Ciclo:','Si el rayo no intersecta a la arista seleccionada','Ir a la siguiente arista en el DCEL del diagrama de voronoi',this.restart_loop.bind(this)),
            this.UI_obj('Ciclo:','Si el rayo intersecta pero el segmento no','',this.condition_2.bind(this)),
            this.UI_obj('Ciclo:','Si el rayo intersecta pero el segmento no','Revisar el círculo centrado en el vértice de voronoi del final',this.next_polygon_edge.bind(this)),
            this.UI_obj('Ciclo:','Si el rayo intersecta pero el segmento no','Ir a la siguiente arista del polígono',this.restart_loop.bind(this)),
            this.UI_obj('Ciclo:','Si los segmentos se intersectan','',this.search_intersection.bind(this)),
            this.UI_obj('Ciclo:','Si los segmentos se intersectan','Revisar el círculo centrado en la intersección e incrementar el número de intersecciones de la arista de voronoi.',this.move_to_adyacent_voronoi_region.bind(this)),
            this.UI_obj('Ciclo:','Si los segmentos se intersectan','Cambiar a la región de voronoi adyacente (Usando twin del DCEL)',this.restart_loop.bind(this)),
            this.UI_obj('Termina el ciclo al darle una vuelta al polígono.', '', '', this.search_voronoi_vertices.bind(this)),
            this.UI_obj('Revisar los vertices de voronoi dentro del polígono', 'Se hace un DFS', 'Se determina cuales estan dentro usando el número de intersecciones de las aristas de voronoi', this.show_largest_empty_circle.bind(this)),
            this.UI_obj('Resultado:', 'Mayor círculo vacío con centro restringido al polígono','',this.do_nothing.bind(this))
        ];
        this.reset();
    }
    reset(){
        this.finished = false;
        this.step = 0;
        this.do_while = false;
        this.largest_empty_circle = {
            radius: 0,
            center: null,
            board_point: null,
            board_circle: null
        }
        this.polygon_vertex_circle = null;
        this.polygon_edge = null;
        this.polygon_first_edge = null;
        this.voronoi_edge = null;
        this.voronoi_vertices_circles = [];
        this.current_face = null;
        this.site_circle = null;
        this.intersection_point = null;
        this.intersection_circle = null;
        this.mx = 0;
    }
    delete_from_board(){
        if(this.interval !== null){
            clearInterval(this.interval);
            this.interval = null;
        }
        if(this.board !== null){
            if(this.largest_empty_circle.board_circle !== null) this.board.remove_circle(this.largest_empty_circle.board_circle);
            if(this.largest_empty_circle.board_point !== null) this.board.delete_point(this.largest_empty_circle.center);
            if(this.polygon_vertex_circle !== null) this.board.remove_circle(this.polygon_vertex_circle);
            this.voronoi_vertices_circles.map(c => this.board.remove_circle(c));
            if(this.site_circle !== null) this.board.remove_circle(this.site_circle);
            if(this.intersection_circle !== null) this.board.remove_circle(this.intersection_circle);
            if(this.intersection_point !== null) this.board.delete_point(this.intersection_point);
            this.voronoi.get_dcel().half_edges.map(he => {
                he.data.lec_number_of_intersections = 0;
                he.data.lec_dfs_visited = false;
            });
        }
        if(this.UI !== null){
            this.UI.change_text('Iniciar','','');
        }
        this.reset();
    }
    start(){
        if(!this.polygon.done() || !this.voronoi.done()) return;
        if(this.board !== null){
            var bb = this.board.get_bounding_box();
            this.mx = Math.max(bb[2]-bb[0], bb[1]-bb[3]);
            this.circle_radius = this.mx/70;
        }
        this.polygon_edge = this.polygon.get_dcel().half_edges[0];
        this.polygon_first_edge = this.polygon_edge;
        this.polygon.select_edge(this.polygon_edge);
        this.step = 1;
    }
    closest_site(){
        var inf = this.mx;
        var best_distance = inf;
        var best_site = this.voronoi.get_dcel().faces[0];
        this.voronoi.get_dcel().faces.map( face => {
            var dis = distance(this.polygon_edge.p1, face.identifier);
            if(dis < best_distance){
                best_distance = dis;
                best_site = face;
            }
        });
        if(this.board !== null){
            this.site_circle = this.board.add_circle(best_site.identifier, this.circle_radius, this.circle_stroke_width, 'red');
        }
        this.current_face = best_site;
        this.step = 2;
    }
    intersecting_edge(){
        var edge = this.current_face.incident_edge;
        var ray = this.polygon_edge;
        while(!Intersections.segment_ray_intersects(edge, ray)){
            edge = edge.next;
        }
        this.voronoi_edge = edge;
        this.voronoi.select_edge(this.voronoi_edge);
        this.step = 3;
    }
    while_condition(){
        if(this.do_while && this.polygon_first_edge.equals(this.polygon_edge)){
            if(this.board !== null){
                this.board.remove_circle(this.site_circle);
                this.site_circle = null;
            }
            this.step = 13;
        } else {
            this.step += 1;
        }
    }
    condition_1(){
        if(!Intersections.segment_ray_intersects(this.voronoi_edge, this.polygon_edge)){
            this.voronoi_edge = this.voronoi_edge.next;
            this.voronoi.select_edge(this.voronoi_edge);
            this.step = 6;
        } else {
            this.step = 7;
        }
    }
    condition_2(){
        if(Intersections.segment_ray_intersects(this.voronoi_edge, this.polygon_edge) && !Intersections.semgent_segment_intersects(this.voronoi_edge, this.polygon_edge)){
            var radius = distance(this.polygon_edge.p2, this.current_face.identifier);
            if(this.board !== null){
                this.polygon_vertex_circle = this.board.add_circle(this.polygon_edge.p2, radius,this.circle_stroke_width, 'purple');
            }
            if(radius > this.largest_empty_circle.radius){
                this.largest_empty_circle.radius = radius;
                this.largest_empty_circle.center = new Vertex(this.polygon_edge.p2.x, this.polygon_edge.p2.y, new VertexData(null, null));
            }
            this.step = 8;
        } else {
            this.step = 10;
        }
    }
    next_polygon_edge(){
        this.polygon_edge = this.polygon_edge.next;
        if(this.board !== null){
            this.board.remove_circle(this.polygon_vertex_circle);
            this.polygon_vertex_circle = null;
        }
        this.polygon.select_edge(this.polygon_edge);
        this.do_while = true;
        this.step += 1;
    }
    restart_loop(){
        this.step = 4;
    }
    search_intersection(){
        this.voronoi_edge.data.lec_number_of_intersections += 1;
        this.voronoi_edge.twin.data.lec_number_of_intersections += 1;
        var inter = Intersections.lines_intersection(this.polygon_edge, this.voronoi_edge);
        inter.data = new VertexData(null, null);
        var radius = distance(inter, this.current_face.identifier);
        if(this.board !== null){
            inter.data.global_id = this.board.next_point_index();
            this.board.add_point(inter.x, inter.y, 'purple');
            this.intersection_point = inter;
            this.intersection_circle = this.board.add_circle(inter, radius, this.circle_stroke_width, 'purple');
        }
        if(radius > this.largest_empty_circle.radius){
            this.largest_empty_circle.radius = radius;
            this.largest_empty_circle.center = new Vertex(inter.x, inter.y, new VertexData(null, null));
        }
        this.step += 1;
    }
    move_to_adyacent_voronoi_region(){
        if(this.board !== null){
            this.board.remove_circle(this.intersection_circle);
            this.board.remove_circle(this.site_circle);
            this.board.delete_point(this.intersection_point);
            this.intersection_circle = this.intersection_point = null;
        }
        this.voronoi_edge = this.voronoi_edge.twin.next;
        this.current_face = this.voronoi_edge.incident_face;
        this.voronoi.select_edge(this.voronoi_edge);
        if(this.board !== null){
            this.site_circle = this.board.add_circle(this.current_face.identifier, this.circle_radius, this.circle_stroke_width, 'red');
        }
        this.step += 1;
    }
    do_nothing(){
        this.step += 1;
    }
    done(){
        return this.step >= this.UI_DATA.length;
    }
    next(){
        if(this.done()){
            this.pause();
            return;
        }
        this.UI_DATA[this.step].action();
        if(!this.done()) this.UI.change_text(this.UI_DATA[this.step].t1, this.UI_DATA[this.step].t2, this.UI_DATA[this.step].t3);
    }
    play(){
        if(this.interval === null) this.interval = setInterval(this.next, 250);
    }
    pause(){
        if(this.interval !== null){
            clearInterval(this.interval);
            this.interval = null;
        }
    }
    search_voronoi_vertices(){
        var edge = this.voronoi.outside_face.incident_edge;
        var queue = new Queue();
        queue.push({e: edge, inside: false});
        edge.data.lec_dfs_visited = true;
        var inside;
        while(!queue.empty()){
            var curr = queue.peek(); queue.pop();
            if(curr.inside){
                var radius = distance(curr.e.p1, curr.e.incident_face.identifier);
                if(this.board !== null){
                    this.voronoi_vertices_circles.push(this.board.add_circle(curr.e.p1,radius,this.circle_stroke_width,'purple'));
                }
                if(radius > this.largest_empty_circle.radius){
                    this.largest_empty_circle.radius = radius;
                    this.largest_empty_circle.center = new Vertex(curr.e.p1.x, curr.e.p1.y, new VertexData(null, null));
                }
            }
            inside = (curr.e.data.lec_number_of_intersections%2 === 1)? !curr.inside : curr.inside;
            if(!curr.e.next.data.lec_dfs_visited){
                curr.e.next.data.lec_dfs_visited = true;
                queue.push({e:curr.e.next, inside: inside});
            }
            if(!curr.e.twin.data.lec_dfs_visited){
                curr.e.twin.data.lec_dfs_visited = true;
                queue.push({e:curr.e.twin, inside: inside});
            }
        }
        this.step += 1;
    }
    show_largest_empty_circle(){
        if(this.board !== null){
            this.voronoi_vertices_circles.map(c => this.board.remove_circle(c));
            this.voronoi_vertices_circles = [];
            this.largest_empty_circle.center.data.global_id = this.board.next_point_index();
            this.largest_empty_circle.board_point = this.board.add_point(this.largest_empty_circle.center.x, this.largest_empty_circle.center.y, 'purple');
            this.largest_empty_circle.board_circle = this.board.add_circle(this.largest_empty_circle.center, this.largest_empty_circle.radius, this.circle_stroke_width, 'purple');
        }
        this.step += 1;
    }
}
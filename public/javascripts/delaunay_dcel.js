import { HalfEdge, HalfEdgeData, Face, Vertex, VertexData, FaceData } from "./data_structures/DCEL.js";
import { Delaunay_UI } from './UI/delaunay_ui.js';
import Queue from "./data_structures/queue.js";
import { Vector } from "./vector_functions.js";

export default class DelaunayDCEL {
    constructor(sites, Delaunay_UI = null, board_ref = null){
        // Constants
        this.sites = sites;
        this.UI = Delaunay_UI;
        this.board = board_ref;
        this.line_width = 1;
        this.dash = 1;
        this.line_color = 'red';
        // Variables
        this.dcel = null;
        this.board_lines = null;
        this.selected_edge = null;
        this.arrow = null;
        this.triangulation_done = false;
        this.tesselation_done = false;
        this.reset();
    }
    reset(){
        this.dcel = {
            vertices: [],
            half_edges: [],
            faces: []
        }
        this.board_lines = [];
        this.selected_edge = null;
        this.arrow = null;
        this.triangulation_done = false;
        this.tesselation_done = false;
        if(this.UI !== null){
            this.UI.show_generators();
            this.UI.hide_edge();
        }
    }
    build(){
        this.dcel.vertices = this.sites.get_vertices();
        if(this.dcel.vertices.length < 2 || this.triangulation_done) return;

        var delaunay = new Delaunay(this.sites.get_vertices());
        var external_edge = delaunay.getQuads(); // See what happens with 1 point, 2 points, collinear points

        var queue = new Queue();
        queue.push(external_edge);
        external_edge.mark_delaunay_1 = true;
        do {
            var curr = queue.peek(); queue.pop();
            var local_id = this.dcel.half_edges.length, global_id = -1;
            var he = new HalfEdge(curr.orig, curr.dest, new HalfEdgeData(local_id, global_id, this));
            curr.dcel_half_edge = he;
            if(!curr.lnext.mark_delaunay_1){
                curr.lnext.mark_delaunay_1 = true;
                queue.push(curr.lnext);
            } else if(curr.lnext.dcel_half_edge !== null) {
                curr.dcel_half_edge.next = curr.lnext.dcel_half_edge;
                curr.lnext.dcel_half_edge.prev = curr.dcel_half_edge;
            }
            if(!curr.lprev.mark_delaunay_1){
                curr.lprev.mark_delaunay_1 = true;
                queue.push(curr.lprev);
            } else if(curr.lprev.dcel_half_edge !== null) {
                curr.dcel_half_edge.prev = curr.lprev.dcel_half_edge;
                curr.lprev.dcel_half_edge.next = curr.dcel_half_edge;
            }
            if(!curr.sym.mark_delaunay_1){
                curr.sym.mark_delaunay_1 = true;
                queue.push(curr.sym);
            } else if(curr.sym.dcel_half_edge !== null) {
                curr.dcel_half_edge.twin = curr.sym.dcel_half_edge;
                curr.sym.dcel_half_edge.twin = curr.dcel_half_edge;
            }

            if(this.board !== null){
                var line = null;
                if(he.twin === null){
                    he.data.global_id = this.board.next_line_index();
                    line = this.board.add_bidirectional_edge(he.p1, he.p2, this.line_width, this.dash, this.line_color, he, Delaunay_UI);
                    if(line !== null){
                        this.board_lines.push(line);
                    }
                }
                else he.data.global_id = he.twin.data.global_id;
            }
            this.dcel.half_edges.push(he);
        } while(!queue.empty());

        this.triangulation_done = true;

        if(this.UI !== null){
            this.UI.hide_edge();
            this.UI.hide_generators();
        }
    }
    build_tesselation(){
        if(!this.triangulation_done) return;
        // mark the outside, create an outside point
        var queue = new Queue();
        var outside_point = new Vertex(Infinity, Infinity, new VertexData(-1, -1));
        var external = this.dcel.half_edges[0];
        var outside_face = new Face(outside_point, external, new FaceData(this.dcel.faces.length)); this.dcel.faces.push(outside_face);
        queue.push(external);
        while(!queue.empty()){
            var curr = queue.peek(); queue.pop();
            if(!curr.next.data.delaunay_mark){
                curr.next.data.delaunay_mark = true;
                curr.incident_face = outside_face;
                queue.push(curr.next);
                curr = curr.next;
            }
        }
        var internal = this.dcel.half_edges[0].twin; // Check if there are inside edges
        queue.push(internal);
        while(!queue.empty()){
            var curr = queue.peek(); queue.pop();
            if(!curr.data.delaunay_mark){
                var points = [];
                var edge = curr;
                // Triangle Face
                var face = new Face(null, curr, new FaceData(this.dcel.faces.length));
                while(!edge.data.delaunay_mark){
                    edge.data.delaunay_mark = true;
                    edge.incident_face = face;
                    points.push(edge.p1);
                    edge = edge.next;
                }
                if(points.length !== 3) throw `${curr.to_html()} is not part of a triangle.`;
                var circumcircle = Vector.circumcircle(points[0], points[1], points[2]);
                face.identifier = circumcircle;
                this.dcel.faces.push(face);
                // Add twins or join triangles
                while(edge.data.delaunay_mark){ edge.data.delaunay_mark = false; edge = edge.next; } // Reset
                while(!edge.data.delaunay_mark){
                    edge.data.delaunay_mark = true;
                    if(!edge.twin.data.delaunay_mark){
                        queue.push(edge.twin);
                    } else if(edge.twin.incident_face.data.local_id !== outside_face.data.local_id && edge.incident_face.identifier.equals(edge.twin.incident_face.identifier)){
                        this.join_faces(edge, edge.twin);
                    }
                    edge = edge.next;
                }
            }
        }
        this.clean_dcel();
        this.tesselation_done = true;
    }
    find(face){
        if(face.data.local_id === face.data.union_find_value) return face;
        face.data.union_find_value = this.find(this.dcel.faces[face.data.union_find_value]).data.local_id;
        return this.dcel.faces[face.data.union_find_value];
    }
    join_faces(dcel_half_edge_1, dcel_half_edge_2){
        var face_1 = this.find(dcel_half_edge_1.incident_face);
        var face_2 = this.find(dcel_half_edge_2.incident_face);
        // Create a new face, representing the union of the two faces
        var join_face = new Face(face_1.identifier, dcel_half_edge_1.next, new FaceData(this.dcel.faces.length));
        this.dcel.faces.push(join_face);
        // Make the old faces point to the new face
        face_1.data.union_find_value = join_face.data.local_id; face_2.data.union_find_value = join_face.data.local_id;
        // Join the edges as if we delete them
        dcel_half_edge_1.next.prev = dcel_half_edge_2.prev;
        dcel_half_edge_2.next.prev = dcel_half_edge_1.prev;
        dcel_half_edge_2.prev.next = dcel_half_edge_1.next;
        dcel_half_edge_1.prev.next = dcel_half_edge_2.next;
        // Delete the half edges from board
        if(this.board !== null){
            this.board.delete_bidirectional_edge(dcel_half_edge_1);
        }
        // Delete from dcel
        this.dcel.half_edges[dcel_half_edge_1.data.local_id] = null;
        this.dcel.half_edges[dcel_half_edge_2.data.local_id] = null;
    }
    clean_dcel(){
        this.dcel.half_edges = this.dcel.half_edges.filter((he) => { 
            return he !== null; 
        }).map((he, i) => {
            he.local_id = i;
            he.incident_face = this.dcel.faces[this.find(he.incident_face).data.union_find_value];
            return he;
        });
        this.dcel.faces = this.dcel.faces.filter((face) => {
            return face.data.local_id === face.data.union_find_value;
        }).map((face, i)=>{
            face.data.local_id = i;
            face.data.union_find_value = i;
            return face;
        });
    }
    get_dcel(){
        return this.dcel;
    }
    delete_from_board(){
        if(this.board !== null){
            this.dcel.half_edges.map(e => this.board.delete_bidirectional_edge(e));
            if(this.arrow !== null) this.board.delete_arrow(this.arrow);
        }
        this.reset();
    }
    select_edge(dcel_half_edge){
        if(this.board === null) return;
        if(this.selected_edge !== null){
            this.board.delete_arrow(this.arrow);
        }
        if(this.UI !== null){
            this.UI.show_edge(dcel_half_edge);
        }
        this.selected_edge = dcel_half_edge;
        this.arrow = this.board.add_arrow(dcel_half_edge, this.line_color);
    }
    done(){
        return this.tesselation_done;
    }
}
import { Vertex, VertexData, HalfEdge, HalfEdgeData, Face, FaceData } from './data_structures/DCEL.js';
import Queue from './data_structures/queue.js';
import { Intersections } from './segments_rays_intersections.js';
import { Vector } from './vector_functions.js';
/**
 * @author Santiago Ley
 * Stores and builds the voronoi diagram given the DCEL of a delaunay tesselation
 * Uses polygon points to determine the bounding box
 */
export default class Voronoi {
    constructor(delaunay, polygon, Voronoi_UI=null, board_ref=null){
        this.delaunay = delaunay;
        this.polygon = polygon;
        this.UI = Voronoi_UI;
        this.board = board_ref;
        this.dcel = null;
        this.color = 'green';
        this.line_width = 1;
        this.dash = 0;
        this.corners = null;
        this.arrow = null;
        this.selected_edge = null;
        this.outside_face = null;
        this.built = false;
        this.reset();
    }
    reset(){
        this.arrow = null;
        this.selected_edge = null;
        this.built = false;
        this.dcel = {
            vertices:[],
            half_edges:[],
            faces: []
        }
        this.corners = {
            tl: null,
            tr: null,
            bl: null,
            br: null
        };
        this.delaunay.delete_from_board();
    }
    set_corners(){
        if(this.dcel.vertices.length <= 1) return;
        var minx,maxx,miny,maxy;
        minx = maxx = this.dcel.vertices[1].x; miny = maxy = this.dcel.vertices[1].y;
        this.dcel.vertices.map(v => {
            if(v.x === Infinity || v.y === Infinity) return;
            minx = Math.min(minx, v.x); maxx = Math.max(maxx, v.x);
            miny = Math.min(miny, v.y); maxy = Math.max(maxy, v.y);
        });
        this.delaunay.get_dcel().vertices.map(v => {
            minx = Math.min(minx, v.x); maxx = Math.max(maxx, v.x);
            miny = Math.min(miny, v.y); maxy = Math.max(maxy, v.y);
        });
        this.polygon.get_dcel().vertices.map(v => {
            minx = Math.min(minx, v.x); maxx = Math.max(maxx, v.x);
            miny = Math.min(miny, v.y); maxy = Math.max(maxy, v.y);
        });
        var eps = Math.max(Math.max(maxx-minx, maxy-maxx)*0.2, 10);
        minx -= eps; maxx += eps; miny -= eps; maxy += eps;
        var tl_id = null, tr_id = null, bl_id = null, br_id = null;
        if(this.board !== null){
            tl_id = this.board.next_point_index();
            this.board.add_point(minx, maxy, this.color);
            tr_id = this.board.next_point_index();
            this.board.add_point(maxx, maxy, this.color);
            bl_id = this.board.next_point_index();
            this.board.add_point(minx, miny, this.color);
            br_id = this.board.next_point_index();
            this.board.add_point(maxx, miny, this.color);
            this.board.update_bounding_box();
        }
        this.corners.tl = new Vertex(minx, maxy, new VertexData(this.dcel.vertices.length, tl_id));
        this.corners.tr = new Vertex(maxx, maxy, new VertexData(this.dcel.vertices.length+1, tr_id));
        this.corners.bl = new Vertex(minx, miny, new VertexData(this.dcel.vertices.length+2, bl_id));
        this.corners.br = new Vertex(maxx, miny, new VertexData(this.dcel.vertices.length+3, br_id));
        this.dcel.vertices.push(this.corners.tl);
        this.dcel.vertices.push(this.corners.tr);
        this.dcel.vertices.push(this.corners.bl);
        this.dcel.vertices.push(this.corners.br);
    }
    outside_edge(half_edge){
        return half_edge.incident_face.data.local_id === 0 || half_edge.twin.incident_face.data.local_id === 0;
    }
    join_internal_vertices(){
        var external_delaunay_edge = this.delaunay.get_dcel().half_edges[0];
        var queue = new Queue();
        queue.push(external_delaunay_edge);
        while(!queue.empty()){
            var curr = queue.peek(); queue.pop();
            if(!curr.data.voronoi_mark){
                curr.data.voronoi_mark = true;
                curr.twin.data.voronoi_mark = true;
                var he1=null, he2=null;
                if(!this.outside_edge(curr)){
                    he1 = new HalfEdge(curr.incident_face.identifier, curr.twin.incident_face.identifier, new HalfEdgeData(this.dcel.half_edges.length, null, this));
                    he2 = new HalfEdge(curr.twin.incident_face.identifier, curr.incident_face.identifier, new HalfEdgeData(this.dcel.half_edges.length+1, null, this));
                    curr.data.intersector = he2; he2.data.intersector = curr;
                    curr.twin.data.intersector = he1; he1.data.intersector = curr.twin;
                    he1.twin = he2; he2.twin = he1;
                    he1.incident_face = this.dcel.faces[curr.p2.data.local_id];
                    he2.incident_face = this.dcel.faces[curr.p1.data.local_id];
                    this.dcel.half_edges.push(he1); this.dcel.half_edges.push(he2);
                    if(this.board !== null){
                        he1.data.global_id = this.board.next_line_index();
                        this.board.add_bidirectional_edge(he1.p1, he1.p2, this.line_width,this.dash,this.color,he1,this.UI);
                        he2.data.global_id = this.board.next_line_index();
                        this.board.add_bidirectional_edge(he2.p1, he2.p2, this.line_width,this.dash,this.color,he2,this.UI);
                    }
                }
                if(!curr.next.data.voronoi_mark){
                    queue.push(curr.next);
                } else if(!this.outside_edge(curr) && !this.outside_edge(curr.next)){
                    curr.twin.data.intersector.prev = curr.next.data.intersector;
                    curr.next.data.intersector.next = curr.twin.data.intersector;
                }
                if(!curr.prev.data.voronoi_mark){
                    queue.push(curr.prev);
                } else if(!this.outside_edge(curr) && !this.outside_edge(curr.prev)){
                    curr.data.intersector.next = curr.prev.twin.data.intersector;
                    curr.prev.twin.data.intersector.prev = curr.data.intersector;
                }
                if(!curr.twin.next.data.voronoi_mark){
                    queue.push(curr.twin.next);
                } else if(!this.outside_edge(curr) && !this.outside_edge(curr.twin.next)){
                    curr.data.intersector.prev = curr.twin.next.data.intersector;
                    curr.twin.next.data.intersector.next = curr.data.intersector;
                }
                if(!curr.twin.prev.data.voronoi_mark){
                    queue.push(curr.twin.next);
                } else if(!this.outside_edge(curr) && !this.outside_edge(curr.twin.prev)){
                    curr.twin.data.intersector.next = curr.twin.prev.twin.data.intersector;
                    curr.twin.prev.twin.data.intersector.prev = curr.twin.data.intersector;
                }
            }
        }
    }
    make_outer_cells(){
        var edge = this.delaunay.get_dcel().half_edges[0];
        var top_border = new HalfEdge(this.corners.tl, this.corners.tr, null);
        var right_border = new HalfEdge(this.corners.tr, this.corners.br, null);
        var bottom_border = new HalfEdge(this.corners.br, this.corners.bl, null);
        var left_border = new HalfEdge(this.corners.bl, this.corners.tl, null);
        var borders = [top_border, right_border, bottom_border, left_border];
        while(!Intersections.segment_ray_intersects(top_border, Vector.outwards_vector(edge)) || Intersections.segment_ray_intersects(top_border, Vector.outwards_vector(edge.next))){
            edge = edge.next;
        }
        // Make line before top right
        var inter = Intersections.lines_intersection(top_border, Vector.outwards_vector(edge));
        inter.data = new VertexData(this.dcel.vertices.length, null);
        var he = new HalfEdge(edge.twin.incident_face.identifier, inter, new HalfEdgeData(this.dcel.half_edges.length, null, this));
        var twin = new HalfEdge(inter, edge.twin.incident_face.identifier, new HalfEdgeData(this.dcel.half_edges.length+1, null, this));
        he.twin = twin; twin.twin = he;
        edge.data.intersector = he; edge.twin.data.intersector = twin;
        if(this.board !== null){
            inter.data.global_id = this.board.next_point_index();
            he.data.global_id = this.board.next_line_index();
            twin.data.global_id = he.data.global_id;
            this.board.add_point(inter.x, inter.y, this.color);
            this.board.add_bidirectional_edge(he.p1, he.p2, this.line_width, this.dash, this.color, he, this.UI);
        }
        this.dcel.vertices.push(inter);
        this.dcel.half_edges.push(he);
        this.dcel.half_edges.push(twin);
        // Make all cells except one
        var last = edge;
        edge = edge.next;
        var border_id = 0;
        var I;
        var nxt, nxt_twin, nxt_inter;
        while(!edge.equals(last)){ // DRY MISSING !!! 
            I = [null];
            I.push(twin);
            if(!Intersections.segment_ray_intersects(borders[border_id],Vector.outwards_vector(edge))){
                nxt = new HalfEdge(borders[border_id].p2, inter, new HalfEdgeData(this.dcel.half_edges.length, null, this));
                nxt_twin = new HalfEdge(inter, borders[border_id].p2, new HalfEdgeData(this.dcel.half_edges.length+1, null, this));
                this.dcel.half_edges.push(nxt);
                this.dcel.half_edges.push(nxt_twin);
                nxt.twin = nxt_twin; nxt_twin.twin = nxt;
                if(this.board !== null){
                    nxt.data.global_id = this.board.next_line_index();
                    nxt_twin.data.global_id = nxt.data.global_id;
                    this.board.add_bidirectional_edge(nxt.p1, nxt.p2, this.line_width, this.dash, this.color, nxt, this.UI);
                }
                
                I.push(nxt);
                border_id = (border_id+1)%4;
                while(!Intersections.segment_ray_intersects(borders[border_id], Vector.outwards_vector(edge))){
                    nxt = new HalfEdge(borders[border_id].p2, borders[border_id].p1, new HalfEdgeData(this.dcel.half_edges.length, null, this));
                    nxt_twin = new HalfEdge(borders[border_id].p1, borders[border_id].p2, new HalfEdgeData(this.dcel.half_edges.length+1, null, this));
                    this.dcel.half_edges.push(nxt);
                    this.dcel.half_edges.push(nxt_twin);
                    nxt.twin = nxt_twin; nxt_twin.twin = nxt;
                    if(this.board !== null){
                        nxt.data.global_id = this.board.next_line_index();
                        nxt_twin.data.global_id = nxt.data.global_id;
                        this.board.add_bidirectional_edge(nxt.p1, nxt.p2, this.line_width, this.dash, this.color, nxt, this.UI);
                    }
                    I.push(nxt);
                    border_id = (border_id+1)%4;
                }
                nxt_inter = Intersections.lines_intersection(borders[border_id], Vector.outwards_vector(edge));
                nxt_inter.data = new VertexData(this.dcel.vertices.length, null);
                nxt = new HalfEdge(nxt_inter, borders[border_id].p1, new HalfEdgeData(this.dcel.half_edges.length, null, this));
                nxt_twin = new HalfEdge(borders[border_id].p1, nxt_inter, new HalfEdgeData(this.dcel.half_edges.length+1, null, this));
            } else {
                nxt_inter = Intersections.lines_intersection(borders[border_id], Vector.outwards_vector(edge));
                nxt_inter.data = new VertexData(this.dcel.vertices.length, null);
                nxt = new HalfEdge(nxt_inter, inter, new HalfEdgeData(this.dcel.half_edges.length, null, this));
                nxt_twin = new HalfEdge(inter, nxt_inter, new HalfEdgeData(this.dcel.half_edges.length+1, null, this));
            }
            this.dcel.vertices.push(nxt_inter);
            this.dcel.half_edges.push(nxt);
            this.dcel.half_edges.push(nxt_twin);
            nxt.twin = nxt_twin; nxt_twin.twin = nxt;
            if(this.board !== null){
                nxt_inter.data.global_id = this.board.next_point_index();
                nxt.data.global_id = this.board.next_line_index();
                nxt_twin.data.global_id = nxt.data.global_id;
                this.board.add_point(nxt_inter.x, nxt_inter.y, this.color);
                this.board.add_bidirectional_edge(nxt.p1, nxt.p2, this.line_width, this.dash, this.color, nxt, this.UI);
            }
            I.push(nxt);
            nxt = new HalfEdge(edge.twin.incident_face.identifier, nxt_inter, new HalfEdgeData(this.dcel.half_edges.length, null, this));
            nxt_twin = new HalfEdge(nxt_inter, edge.twin.incident_face.identifier, new HalfEdgeData(this.dcel.half_edges.length+1, null, this));
            this.dcel.half_edges.push(nxt);
            this.dcel.half_edges.push(nxt_twin);
            nxt.twin = nxt_twin; nxt_twin.twin = nxt;
            edge.data.intersector = nxt; edge.twin.data.intersector = nxt_twin;
            
            if(this.board !== null){
                nxt.data.global_id = this.board.next_line_index();
                nxt_twin.data.global_id = nxt.data.global_id;
                this.board.add_bidirectional_edge(nxt.p1, nxt.p2, this.line_width, this.dash, this.color, nxt, this.UI);
            }
            I.push(nxt);
            I.push(null);
            if(edge.twin.incident_face.identifier.equals(edge.prev.twin.incident_face.identifier)){
                I[0] = I[I.length-2];
                I[I.length-1] = I[1];
            } else {
                I[0] = edge.prev.twin.prev.twin.data.intersector;
                I[I.length-1] = edge.twin.next.data.intersector;
            }
            I.map(ed => ed.incident_face = this.dcel.faces[edge.p1.data.local_id]);
            for(var i = 0; i+1<I.length; i++){
                I[i].prev = I[i+1];
                I[i+1].next = I[i];
            }
            for(var i = 2; i+3<I.length; i++){
                I[i].twin.next = I[i+1].twin;
                I[i+1].twin.prev = I[i].twin;
            }
            for(var i = 2; i+2<I.length; i++){
                I[i].twin.incident_face = this.outside_face;
            }
            if(I[1].twin.next !== null){
                I[1].twin.next.twin.next = I[2].twin;
                I[2].twin.prev = I[1].twin.next.twin;
            }
            he = nxt;
            twin = nxt_twin;
            inter = nxt_inter;
            edge = edge.next;
        }
        I = [null];
        I.push(twin);
        if(!Intersections.segment_ray_intersects(borders[border_id],Vector.outwards_vector(edge))){
            nxt = new HalfEdge(borders[border_id].p2, inter, new HalfEdgeData(this.dcel.half_edges.length+1, null, this));
            nxt_twin = new HalfEdge(inter, borders[border_id].p2, new HalfEdgeData(this.dcel.half_edges.length, null, this));
            this.dcel.half_edges.push(nxt);
            this.dcel.half_edges.push(nxt_twin);
            nxt.twin = nxt_twin; nxt_twin.twin = nxt;
            if(this.board !== null){
                nxt.data.global_id = this.board.next_line_index();
                nxt_twin.data.global_id = nxt.data.global_id;
                this.board.add_bidirectional_edge(nxt.p1, nxt.p2, this.line_width, this.dash, this.color, nxt, this.UI);
            }
            I.push(nxt);
            border_id = (border_id+1)%4;
            while(!Intersections.segment_ray_intersects(borders[border_id], Vector.outwards_vector(edge))){
                nxt = new HalfEdge(borders[border_id].p2, borders[border_id].p1, new HalfEdgeData(this.dcel.half_edges.length, null, this));
                nxt_twin = new HalfEdge(borders[border_id].p1, borders[border_id].p2, new HalfEdgeData(this.dcel.half_edges.length+1, null, this));
                this.dcel.half_edges.push(nxt);
                this.dcel.half_edges.push(nxt_twin);
                nxt.twin = nxt_twin; nxt_twin.twin = nxt;
                if(this.board !== null){
                    nxt.data.global_id = this.board.next_line_index();
                    nxt_twin.data.global_id = nxt.data.global_id;
                    this.board.add_bidirectional_edge(nxt.p1, nxt.p2, this.line_width, this.dash, this.color, nxt, this.UI);
                }
                I.push(nxt);
                border_id = (border_id+1)%4;
            }
            nxt = new HalfEdge(edge.data.intersector.p2, borders[border_id].p1, new HalfEdgeData(this.dcel.half_edges.length+1, null, this));
            nxt_twin = new HalfEdge(borders[border_id].p1, edge.data.intersector.p2, new HalfEdgeData(this.dcel.half_edges.length, null, this));
        } else {
            nxt = new HalfEdge(edge.data.intersector.p2, edge.prev.data.intersector.p2, new HalfEdgeData(this.dcel.half_edges.length+1, null, this));
            nxt_twin = new HalfEdge(edge.prev.data.intersector.p2, edge.data.intersector.p2, new HalfEdgeData(this.dcel.half_edges.length, null, this));
        }
        this.dcel.half_edges.push(nxt);
        this.dcel.half_edges.push(nxt_twin);
        nxt.twin = nxt_twin; nxt_twin.twin = nxt;
        if(this.board !== null){
            nxt.data.global_id = this.board.next_line_index();
            nxt_twin.data.global_id = nxt.data.global_id;
            this.board.add_bidirectional_edge(nxt.p1, nxt.p2, this.line_width, this.dash, this.color, nxt, this.UI);
        }
        I.push(nxt);
        I.push(edge.data.intersector);
        I.push(null);
        if(edge.twin.incident_face.identifier.equals(edge.prev.twin.incident_face.identifier)){
            I[0] = I[I.length-2];
            I[I.length-1] = I[1];
        } else {
            I[0] = edge.prev.twin.prev.twin.data.intersector;
            I[I.length-1] = edge.twin.next.data.intersector;
        }
        I.map(ed => ed.incident_face = this.dcel.faces[edge.p1.data.local_id]);
        for(var i = 0; i+1<I.length; i++){
            I[i].prev = I[i+1];
            I[i+1].next = I[i];
        }
        for(var i = 2; i+3<I.length; i++){
            I[i].twin.next = I[i+1].twin;
            I[i+1].twin.prev = I[i].twin;
        }
        for(var i = 2; i+2<I.length; i++){
            I[i].twin.incident_face = this.outside_face;
        }
        I[1].twin.next.twin.next = I[2].twin;
        I[2].twin.prev = I[1].twin.next.twin;
        I[I.length-3].twin.next = I[I.length-2].twin.prev.twin;
        I[I.length-2].twin.prev.twin.prev = I[I.length-3].twin;
    }
    build(){
        if(!this.delaunay.done()) this.delaunay.build();
        if(!this.delaunay.done() || !this.polygon.done()) return;
        this.dcel.vertices = this.delaunay.get_dcel().faces.map((f,i) => {
            f.identifier.data = new VertexData(i,null);
            if(this.board !== null){
                if(f.identifier.x !== Infinity && f.identifier.y !== Infinity){
                    f.identifier.data.global_id = this.board.next_point_index();
                    this.board.add_point(f.identifier.x, f.identifier.y, this.color);
                }
            }
            return f.identifier;
        });
        this.dcel.faces = this.delaunay.get_dcel().vertices.map((v,i) => new Face(v, null, new FaceData(i)));
        this.outside_face = new Face(this.dcel.vertices[0], null, null);

        this.set_corners();
        this.join_internal_vertices();
        this.make_outer_cells();
        this.built = true;
    }
    select_edge(half_edge){
        if(this.board === null) return;
        if(this.selected_edge !== null){
            this.board.delete_arrow(this.arrow);
        }
        if(this.UI !== null){
            this.UI.show_edge(half_edge);
        }
        this.selected_edge = half_edge;
        this.arrow = this.board.add_arrow(half_edge, this.color);
    }
    done(){
        return this.built;
    }
    delete_from_board(){
        if(this.board !== null){
            this.dcel.half_edges.map(e => this.board.delete_bidirectional_edge(e));
            if(this.arrow !== null) this.board.delete_arrow(this.arrow);
            this.dcel.vertices.map(v => {
                if(v.x !== Infinity && v.y !== Infinity) this.board.delete_point(v);
            });
        }
        this.reset();
    }
}
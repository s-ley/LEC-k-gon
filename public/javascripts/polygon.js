import { Vertex, VertexData, HalfEdge, HalfEdgeData } from "./data_structures/DCEL.js";
import { Vector } from "./vector_functions.js";
import { polygon_examples } from "./Examples/polygon_examples.js";

export default class Polygon {
    constructor(Polygon_UI=null, board_ref = null){
        this.pointColor = 'blue';
        this.line_width = 1;
        this.dash = 0;

        this.dcel = null;
        this.UI = Polygon_UI;
        this.board = board_ref;
        this.manual = false;
        this.finished = false;
        this.reset();
    }
    reset(){
        this.dcel = {
            vertices: [],
            half_edges: []
        }
        this.manual = false;
        this.finished = false;
        if(this.UI !== null){
            this.UI.list_reset();
            this.UI.show_generators();
            this.UI.hide_download();
        }
    }
    to_string(){
        return this.dcel.vertices.map(s => `${s.x} ${s.y}`).join(' ');
    }
    add_vertex(x,y){
        if(this.finished) return;
        var local_id = this.dcel.vertices.length;
        var global_id = null;
        if(this.board !== null){
            global_id = this.board.next_point_index();
            this.board.add_point(x,y,this.pointColor);
        }
        var vertex = new Vertex(x,y,new VertexData(local_id,global_id));
        this.dcel.vertices.push(vertex);
        if(this.UI !== null){
            this.UI.list_add(x,y,global_id);
        }
        // Create edges
        if(local_id > 0){
            var prev = this.dcel.vertices[local_id-1];
            local_id = this.dcel.half_edges.length;
            global_id = null;
            var half_edge = new HalfEdge(prev, vertex, new HalfEdgeData(local_id,global_id,null));
            var twin = new HalfEdge(vertex, prev, new HalfEdgeData(local_id+1,global_id,null));
            half_edge.twin = twin; twin.twin = half_edge;
            if(this.dcel.half_edges.length > 0){
                half_edge.prev = this.dcel.half_edges[local_id-2]; this.dcel.half_edges[local_id-2].next = half_edge;
                twin.next = this.dcel.half_edges[local_id-1]; this.dcel.half_edges[local_id-1].prev = twin;
            }
            if(this.board !== null){
                global_id = this.board.next_line_index();
                this.board.add_bidirectional_edge(prev, vertex, this.line_width, this.dash, this.pointColor, null, null);
                half_edge.data.global_id = global_id;
                twin.data.global_id = global_id;
            }
            this.dcel.half_edges.push(half_edge);
            this.dcel.half_edges.push(twin);
        }
    }
    close(){
        if(Vector.collinear(this.dcel.half_edges)) { // Tambien verificar que sea simple
            console.log('Colineares');
            return;
        }
        if(this.finished){
            return;
        }
        var prev = this.dcel.vertices[this.dcel.vertices.length-1];
        var vertex = this.dcel.vertices[0];
        var local_id = this.dcel.half_edges.length;
        var global_id = null;
        var half_edge = new HalfEdge(prev, vertex, new HalfEdgeData(local_id,global_id,null));
        var twin = new HalfEdge(vertex, prev, new HalfEdgeData(local_id+1,global_id,null));
        half_edge.twin = twin; twin.twin = half_edge;

        half_edge.prev = this.dcel.half_edges[local_id-2]; this.dcel.half_edges[local_id-2].next = half_edge;
        twin.next = this.dcel.half_edges[local_id-1]; this.dcel.half_edges[local_id-1].prev = twin;

        half_edge.next = this.dcel.half_edges[0]; this.dcel.half_edges[0].prev = half_edge;
        twin.prev = this.dcel.half_edges[1]; this.dcel.half_edges[1].next = twin;
        if(this.board !== null){
            global_id = this.board.next_line_index();
            this.board.add_bidirectional_edge(prev, vertex, this.line_width, this.dash, this.pointColor, null, null);
            half_edge.data.global_id = global_id;
            twin.data.global_id = global_id;

            this.board.update_bounding_box();
        }
        this.dcel.half_edges.push(half_edge);
        this.dcel.half_edges.push(twin);

        this.finished = true; // Checar que sea ccw, si no voltearlo
        if(this.UI !== null){
            this.UI.hide_generators();
            this.UI.show_download(this.to_string());
        }
    }
    delete_from_board(){
        if(this.board === null) return;
        this.dcel.half_edges.map((he, i)=>{
            if(i%2===0){
                this.board.delete_bidirectional_edge(he);
            }
        });
        this.dcel.vertices.map(v => this.board.delete_point(v));
        this.reset();
    }
    enable_manual(){
        this.manual = true;
    }
    disable_manual(){
        this.manual = false;
    }
    manual_enabled(){
        return this.manual;
    }
    done(){
        return this.finished;
    }
    get_dcel(){
        return this.dcel;
    }
    load_example(num){
        if(this.dcel.vertices.length>0){
            return;
        }
        for(var i = 0; i+1<polygon_examples[num].length; i+=2){
            this.add_vertex(polygon_examples[num][i], polygon_examples[num][i+1]);
        }
        this.close();
    }
}
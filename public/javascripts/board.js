import { Vector } from "./vector_functions.js";
import { Vertex, VertexData, HalfEdge, HalfEdgeData } from "./data_structures/DCEL.js";
import Queue from './data_structures/queue.js';
import PairSet from './data_structures/pair_set.js';

export default class Board {
    constructor(){
        this.line_set = null;
        this.bb = null;
        this.point_list = null;
        this.line_list = null;
        this.point_pool = null;
        this.line_pool = null;
        this.board = null;
        this.polygon = null;
        this.reset();
    }
    reset(){
        if(this.line_set===null) this.line_set = new PairSet(); else this.line_set.reset();
        this.bb = [-3, 3, 3, -3];
        this.point_list = [];
        this.line_list = [];
        if(this.point_pool===null) this.point_pool = new Queue(); else this.point_pool.clear();
        if(this.line_pool===null) this.line_pool = new Queue(); else this.line_pool.clear();
        if(this.board !== null) JXG.JSXGraph.freeBoard(this.board);
        this.create_board();
    }
    create_board(){
        this.board = JXG.JSXGraph.initBoard('box', {boundingbox: this.bb, axis:true });
        this.board.on('down', this.click_event.bind(this));
    }
    update_bounding_box(){
        var tmp = [...this.bb];
        var eps = Math.max(Math.max(tmp[1]-tmp[3], tmp[2]-tmp[0])*0.2, 10);
        tmp[0] -= eps; tmp[1] += eps; tmp[2] += eps; tmp[3] -= eps;
        this.board.setBoundingBox(tmp);
    }
    add_bidirectional_edge(dcel_vertex_1, dcel_vertex_2, width, dash, color, dcel_half_edge = null, UI = null){
        var i1 = dcel_vertex_1.data.global_id, i2 = dcel_vertex_2.data.global_id;
        var id1 = Math.min(i1, i2), id2 = Math.max(i1,i2);
        if(!this.line_set.has(id1, id2)){
            var line = this.board.create('line', [this.point_list[id1], this.point_list[id2]], {straightFirst: false, straightLast:false, strokeWidth:width, dash:dash, strokeColor: color});
            line.index = this.next_line_index();
            if(UI !== null && dcel_half_edge !== null){
                line.half_edge = dcel_half_edge;
                line.UI = UI;
                line.on('up', function(e){
                    this.half_edge.data.collection.select_edge(this.half_edge);
                });
            }
            this.line_set.add(id1, id2);
            if(this.line_pool.empty()) this.line_list.push(line);
            else {
                var free_index = this.line_pool.peek(); this.line_pool.pop();
                this.line_list[free_index] = line;
            }
            return line;
        }
        return null;
    }
    delete_bidirectional_edge(dcel_half_edge){
        var i1 = dcel_half_edge.p1.data.global_id, i2 = dcel_half_edge.p2.data.global_id;
        var id1 = Math.min(i1, i2), id2 = Math.max(i1,i2);
        if(this.line_set.has(id1, id2)){
            this.line_set.del(id1,id2);
            this.board.removeObject(this.line_list[dcel_half_edge.data.global_id]);
            this.line_pool.push(dcel_half_edge.data.global_id);
            this.line_list[dcel_half_edge.data.global_id] = null;
        }
    }
    add_point(x, y, color, size=2, show_name=true){
        var name = (show_name)? `${this.next_point_index()}`: '';
        var p = this.board.create('point', [x,y], {size: size, name:name, face:'<>', color: color, fixed: true});
        p.index = this.next_point_index();
        if(this.point_pool.empty()) this.point_list.push(p);
        else {
            var free_index = this.point_pool.peek(); this.point_pool.pop();
            this.point_list[free_index] = p;
        }
        // Update minimum and maximum coordinates
        this.bb[0] = Math.min(x, this.bb[0]);
        this.bb[2] = Math.max(x, this.bb[2]);
        this.bb[3] = Math.min(y, this.bb[3]);
        this.bb[1] = Math.max(y, this.bb[1]);
        return p;
    }
    delete_point(dcel_vertex){
        this.board.removeObject(this.point_list[dcel_vertex.data.global_id]);
        this.point_pool.push(dcel_vertex.data.global_id);
        this.point_list[dcel_vertex.data.global_id] = null;
    }
    get_epsilon(){
        var eps = Math.max(this.bb[2]-this.bb[0], this.bb[1]-this.bb[3]);
        eps = Math.max(eps+10, eps*1.2);
        return eps/80;
    }
    add_arrow(dcel_half_edge, color){
        var point_size = 0.5;
        var eps = this.get_epsilon();
        var dir = {
            x:dcel_half_edge.p2.x-dcel_half_edge.p1.x,
            y:dcel_half_edge.p2.y-dcel_half_edge.p1.y,
            z:0
        }
        var z = { x:0, y:0, z:1 }
        var dir_normal = Vector.normalize(dir, eps);
        var inside = Vector.normalize(Vector.cross_product(z,dir), eps);
        // DCEL vertices and lines
        var back = new Vertex(dcel_half_edge.p1.x+inside.x,dcel_half_edge.p1.y+inside.y, new VertexData(-1, this.next_point_index())); this.add_point(back.x, back.y, color, point_size, false);
        var front = new Vertex(dcel_half_edge.p2.x+inside.x, dcel_half_edge.p2.y+inside.y, new VertexData(-1, this.next_point_index())); this.add_point(front.x, front.y, color, point_size, false);
        var right = new Vertex(dcel_half_edge.p2.x-dir_normal.x, dcel_half_edge.p2.y-dir_normal.y, new VertexData(-1, this.next_point_index())); this.add_point(right.x, right.y, color, point_size, false);
        var left = new Vertex(dcel_half_edge.p2.x+2*inside.x-dir_normal.x, dcel_half_edge.p2.y+2*inside.y-dir_normal.y, new VertexData(-1, this.next_point_index())); this.add_point(left.x, left.y, color, point_size, false);
        var line_bf = new HalfEdge(back,front,new HalfEdgeData(-1, this.next_line_index())); this.add_bidirectional_edge(line_bf.p1, line_bf.p2, 1, 0, color, null, null);
        var line_fr = new HalfEdge(front, right, new HalfEdgeData(-1, this.next_line_index())); this.add_bidirectional_edge(line_fr.p1, line_fr.p2, 1, 0, color, null, null);
        var line_fl = new HalfEdge(front, left, new HalfEdgeData(-1, this.next_line_index())); this.add_bidirectional_edge(line_fl.p1, line_fl.p2, 1, 0, color, null, null);
        
        return {
            points: [back,front,right,left],
            lines: [line_bf,line_fr,line_fl]
        }
    }
    delete_arrow(arrow){
        arrow.lines.map(l => this.delete_bidirectional_edge(l));
        arrow.points.map(p => this.delete_point(p));
    }
    next_point_index(){
        if(this.point_pool.empty()) return this.point_list.length;
        else return this.point_pool.peek();
    }
    next_line_index(){
        if(this.line_pool.empty()) return this.line_list.length;
        else return this.line_pool.peek();
    }
    get_bounding_box(){
        return this.bb;
    }
    bind_polygon(polygon){
        if(this.polygon === null) this.polygon = polygon;
    }
    unbind_polygon(){
        this.polygon = null;
    }
    get_mouse_coords(e,i){
        var cPos = this.board.getCoordsTopLeftCorner(e, i),
        absPos = JXG.getPosition(e, i),
        dx = absPos[0]-cPos[0],
        dy = absPos[1]-cPos[1];
        return new JXG.Coords(JXG.COORDS_BY_SCREEN, [dx, dy], this.board);
    }
    click_event(e){
        if(this.polygon === null || !this.polygon.manual_enabled()) return;
        var el, can_create = true;
        var i, coords;
        if(e[JXG.touchProperty]) i = 0;
        coords = this.get_mouse_coords(e,i);
        for(el in this.board.objects){
            if(JXG.isPoint(this.board.objects[el]) && this.board.objects[el].hasPoint(coords.scrCoords[1], coords.scrCoords[2])){
                can_create = false;
                break;
            }
        }
        if(can_create){
            this.polygon.add_vertex(coords.usrCoords[1], coords.usrCoords[2]);
        }
    }
    add_circle(dcel_vertex,radius,width,color){
        var p = this.board.create('point', [dcel_vertex.x+radius, dcel_vertex.y], {
            size: 2, opacity: 0, fixed: true, name: ''
        });
        var c1 = this.board.create('circle', [this.point_list[dcel_vertex.data.global_id], p], {strokeWidth: width, strokeColor: color});
        return {
            point: p,
            circle: c1
        }
    }
    remove_circle(data){
        this.board.removeObject(data.circle);
        this.board.removeObject(data.point);
    }
}

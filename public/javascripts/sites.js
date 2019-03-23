import { Vertex, VertexData } from './data_structures/DCEL.js';
import { sites_examples } from './Examples/sites_examples.js';

export default class Sites {
    constructor(Site_UI = null, board_ref = null){
        this.site_vertices = null;
        // Html and jsxgraph UI
        this.UI = Site_UI;
        this.board = board_ref;
        this.pointColor = 'red';
        this.reset();
    }
    reset(){
        this.site_vertices = [];
        if(this.UI !== null){
            this.UI.list_reset();
            this.UI.show_generators();
            this.UI.hide_download();
        }
    }
    to_string(){
        return this.site_vertices.map(s => `${s.x} ${s.y}`).join(' ');
    }
    add_site(x,y){
        var local_id = this.site_vertices.length;
        var global_id = null;
        if(this.board !== null){
            global_id = this.board.next_point_index();
            this.board.add_point(x,y,this.pointColor);
        }
        this.site_vertices.push(new Vertex(x,y,new VertexData(local_id,global_id)));
        if(this.UI !== null){
            this.UI.list_add(x,y,global_id);
            if(this.site_vertices.length >= 3){
                this.UI.show_download(this.to_string());
                this.UI.hide_generators();
            }
        }
    }
    delete_from_board(){
        if(this.board !== null){
            this.site_vertices.map(p => this.board.delete_point(p));
        }
        this.reset();
    }
    get_vertices(){
        return this.site_vertices;
    }
    load_example(num){
        if(this.site_vertices.length>0){
            return;
        }
        for(var i = 0; i+1<sites_examples[num].length; i+=2){
            this.add_site(sites_examples[num][i], sites_examples[num][i+1]);
        }
        this.board.update_bounding_box();
    }
    valid(){
        return this.site_vertices.length > 0;
    }
}

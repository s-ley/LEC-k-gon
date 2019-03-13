import './file_loader.js';
import './random_section.js';
import { board } from './board.js';
import { sites } from './sites.js';
import { algorithms } from "./algorithms.js";

var line_width = 1;

$('#Delaunay').on('click', ()=>{
    var triangles = algorithms.delaunay(board.get_points());

    var dash = 1;
    
    triangles.map(t => {
        console.log('Triangle');
        console.log(`${t.v0.idx},${t.v1.idx},${t.v2.idx}`);
        board.add_segment(t.v0, t.v1, line_width, dash);
        board.add_segment(t.v0, t.v2, line_width, dash);
        board.add_segment(t.v1, t.v2, line_width, dash);
    });
});

// Set everything up
$( document ).ready(function() {
    board.init([-3, 3, 3, -3]); 
});
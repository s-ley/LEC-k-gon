import './file_loader.js';
import './random_section.js';
import { data } from "./events.js";

$('#Delaunay').on('click', ()=>{
    data.generate_delaunay();
});

// Set everything up
$( document ).ready(function() {
    data.create_board([-3, 3, 3, -3]);
});
import './file_loader.js';
import './random_section.js';
import { board } from './board.js';
import { error } from './error.js';
import {UI} from './UI/UI.js';
import {Voronoi_UI} from './UI/voronoi_ui.js';
import { sites } from "./sites.js";
import { polygon } from "./polygon.js";

// Set everything up
$( document ).ready(function() {
    // UI init
    UI.sites();
    $('.Menu #ShowVoronoi').on('click', function(e){
        Voronoi_UI.show();
    });
    $('.Menu #ShowSite').on('click', function(e){
        UI.sites();
    });
    $('.Plane .Controls #Reset').on('click', function(e){
        board.reset(board.get_bounding_box());
        sites.reset();    
        polygon.reset();
        UI.sites();
    });
    
    board.init([-3, 3, 3, -3]); 
    error.update();
});
import './file_loader.js';
import './random_section.js';
import { board } from './board.js';
import { error } from './error.js';
import {Voronoi_UI} from './UI/voronoi_ui.js';
import {Sites_UI} from './UI/sites_ui.js';
import {Polygon_UI} from './UI/polygon_ui.js';
import { sites } from "./sites.js";
import { polygon } from "./polygon.js";

// Set everything up
$( document ).ready(function() {
    // UI init
    Sites_UI.show();
    $('.Menu #ShowVoronoi').on('click', function(e){
        Voronoi_UI.show();
    });
    $('.Menu #ShowSite').on('click', function(e){
        Sites_UI.show();
    });
    $('.Menu #ShowPolygon').on('click', function(e){
        Polygon_UI.show();
    });
    $('.Plane .Controls #Reset').on('click', function(e){
        board.reset([-3, 3, 3, -3]);
        sites.reset();
        polygon.reset();
        Sites_UI.show();
    });
    board.init([-3, 3, 3, -3]); 
    error.update();
});
import {Voronoi_UI} from './voronoi_ui.js';
import {Sites_UI} from './sites_ui.js';
import {Polygon_UI} from './polygon_ui.js';

function clear(){
    Voronoi_UI.hide();
    Sites_UI.hide();
    Polygon_UI.hide();
}

export const UI = {
    clear: clear
}
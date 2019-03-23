import './board_ui.js';
import { Sites_UI } from './sites_ui.js';
import { Delaunay_UI } from './delaunay_ui.js';
import { Polygon_UI } from './polygon_ui.js';
import { Voronoi_UI } from './voronoi_ui.js';
import { LEC_UI } from './LEC_ui.js';

function clear(){
    Voronoi_UI.hide();
    Sites_UI.hide();
    Polygon_UI.hide();
    LEC_UI.hide();
    Delaunay_UI.hide();
}

export const UI = {
    clear: clear
}
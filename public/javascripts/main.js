import './delaunay-triangulation/delaunay.js';
import { UI } from './UI/UI.js';
import { LEC_UI } from './UI/LEC_ui.js';
import { Sites_UI } from './UI/sites_ui.js';
import { Delaunay_UI } from './UI/delaunay_ui.js';
import { Polygon_UI } from './UI/polygon_ui.js';
import { Voronoi_UI } from './UI/voronoi_ui.js';
import Board from './board.js';
import Sites from './sites.js';
import DelaunayDCEL from './delaunay_dcel.js';
import Polygon from './polygon.js';
import Voronoi from './voronoi.js';
import LEC from './LEC.js';



var board = new Board();
var sites = new Sites(Sites_UI, board);
var delaunay = new DelaunayDCEL(sites, Delaunay_UI, board);
var polygon = new Polygon(Polygon_UI, board);
board.bind_polygon(polygon);

var delaunay_invisible = new DelaunayDCEL(sites);
var voronoi = new Voronoi(delaunay_invisible, polygon, Voronoi_UI, board);

var lec = new LEC(polygon, voronoi, LEC_UI, board);

// Set everything up
$( document ).ready(function() {
    // Init
    UI.clear();
});

export const Main = {
    sites: sites,
    delaunay: delaunay,
    board: board,
    polygon: polygon,
    voronoi: voronoi,
    lec: lec
}
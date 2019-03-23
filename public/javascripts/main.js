import './delaunay-triangulation/delaunay.js';
import './UI/UI.js';
import { error } from './error.js';
import {Sites_UI} from './UI/sites_ui.js';
import { Delaunay_UI } from './UI/delaunay_ui.js';
import Board from './board.js';
import Sites from './sites.js';
import DelaunayDCEL from './delaunay_dcel.js';
import Polygon from './polygon.js';
import { Polygon_UI } from './UI/polygon_ui.js';

var board = new Board();
var sites = new Sites(Sites_UI, board);
var delaunay = new DelaunayDCEL(sites, Delaunay_UI, board);
var polygon = new Polygon(Polygon_UI, board);
board.bind_polygon(polygon);

// Set everything up
$( document ).ready(function() {
    // Init
    Sites_UI.show();
    error.update();
});

export const Main = {
    sites: sites,
    delaunay: delaunay,
    board: board,
    polygon: polygon
}
import { board } from "./board.js";
import { sites } from "./sites.js";
import { polygon } from "./polygon.js";
import {Voronoi_UI} from './UI/voronoi_ui.js';

// TODO:
// Verificar que los puntos no puedan estar a distancia menor que 0.01

var numPoints = 10;
var minx = -50, maxx = 50;
var miny = -50, maxy = 50;

$('#Random input').on('input propertychange', (e) => {
    $('#Random span').text(e.target.value);
    numPoints = e.target.value;
});

$('#Random button').on('click', (e) => {
    board.reset([minx, maxy, maxx, miny]);
    sites.reset();    
    polygon.reset();

    for(var i=0;i<numPoints;i++) {
        sites.add(Math.random()*(maxx-minx)+minx, Math.random()*(maxy-miny)+miny, 'red');
    }
    Voronoi_UI.show();
});

$(document).ready(()=>{
    $('#Random input')[0].value = `${numPoints}`;
    $('#Random span').text(numPoints);
});
import { board } from "./board.js";
import { sites } from "./sites.js";

var numPoints = 20;
var minx = -50, maxx = 50;
var miny = -50, maxy = 50;

$('#Random input').on('input propertychange', (e) => {
    $('#Random span').text(e.target.value);
    numPoints = e.target.value;
});

$('#Random button').on('click', (e) => {
    board.reset([minx, maxy, maxx, miny]);
    sites.reset();
    

    for(var i=0;i<numPoints;i++) {
        sites.add(Math.random()*(maxx-minx)+minx, Math.random()*(maxy-miny)+miny, 'red');
    }
});

$(document).ready(()=>{
    $('#Random input')[0].value = `${numPoints}`;
    $('#Random span').text(numPoints);
});
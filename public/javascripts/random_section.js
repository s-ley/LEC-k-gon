import { data } from "./events.js";

var numPoints = 20;
var minx = -50, maxx = 50;
var miny = -50, maxy = 50;

$('#Random input').on('input propertychange', (e) => {
    $('#Random span').text(e.target.value);
    numPoints = e.target.value;
});

$('#Random button').on('click', (e) => {
    data.delete_board();
    data.create_board([minx, maxy, maxx, miny]);
    for(var i=0;i<numPoints;i++) {
        data.add_point(Math.random()*(maxx-minx)+minx, Math.random()*(maxy-miny)+miny, 'red');
    }
});

$(document).ready(()=>{
    $('#Random input')[0].value = `${numPoints}`;
    $('#Random span').text(numPoints);
});
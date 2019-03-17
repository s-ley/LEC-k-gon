import {UI} from './UI.js';

function show_section(){
    UI.clear();
    $('.Data .Polygon').css('display', 'block');
}
function hide_section(){
    $('.Data .Polygon').css('display', 'none');
}

export const Polygon_UI = {
    show: show_section,
    hide: hide_section
}
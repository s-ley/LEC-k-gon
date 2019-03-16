import {Voronoi_UI} from './voronoi_ui.js';

function clear(){
    Voronoi_UI.hide();
    $('.Data .Sites').css('display', 'none');
}

function show_sites_UI(){
    clear();
    $('.Data .Sites').css('display', 'block');
}

export const UI = {
    clear: clear,
    sites: show_sites_UI
}
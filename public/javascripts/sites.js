import {board} from './board.js';
var site_list = [];

function add_site(x, y, fillColor){
    // HTML
    $('#Sites').append(`<li>(${x.toFixed(2)},${y.toFixed(2)})</li>`);

    // storage
    site_list.push(board.add_point(x,y,fillColor));
}
function remove_all_sites(){
    site_list = [];
    // Reset html list
    $('#Sites').html("");
}

export const sites = {
    add: add_site,
    reset: remove_all_sites
}
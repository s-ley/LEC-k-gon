import {UI} from './UI.js';

function show_section(){
    UI.clear();
    $('.Data .Sites').css('display', 'block');
}
function hide_section(){
    $('.Data .Sites').css('display', 'none');
}

export const Sites_UI = {
    show: show_section,
    hide: hide_section
}
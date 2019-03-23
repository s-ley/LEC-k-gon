import {UI} from './UI.js';
//import {LEC} from '../LEC.js';

function show_section(){
    UI.clear();
    $('.LEC').css('display', 'block');
}
function hide_section(){
    $('.LEC').css('display', 'none');
}
function change_text(s1, s2, s3){
    $('.LEC .Text1').html(s1);
    $('.LEC .Text2').html(s2);
    $('.LEC .Text3').html(s3);
}

export const LEC_UI = {
    show: show_section,
    hide: hide_section,
    change_text: change_text
}

/* $('.LEC .NextStep').on('click', function(e){
    LEC.next();
}); */
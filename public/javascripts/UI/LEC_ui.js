import { Main } from '../main.js';

function show_section(){
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

var open = false;
// Menu button
$('#ShowLEC').on('click', function(e){
    if(!open){
        show_section();
        open = true;
    } else {
        hide_section();
        open = false;
    }
    $('#ShowLEC img').toggleClass('Flip');
});

$('.LEC .NextStep').on('click', function(e){
    Main.lec.next();
});
$('.LEC .Play').on('click', function(e){
    Main.lec.play();
});
$('.LEC .Pause').on('click', function(e){
    Main.lec.pause();
});
$('.LEC .Reset button').on('click', function(e){
    Main.lec.delete_from_board();
});
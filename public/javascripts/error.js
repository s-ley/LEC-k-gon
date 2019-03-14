
var msg = '';

function update_button(){
    if(msg.length > 0){
        $('#Error button').css('opacity', 1);
    } else {
        $('#Error button').css('opacity', 0);
    }
}

function change_msg(str){
    msg = str;
    $('#Error p').text(msg);
    update_button();
}

$('#Error button').on('click', ()=>{
    change_msg('');
});

export const error = {
    change_msg: change_msg,
    update: update_button
}
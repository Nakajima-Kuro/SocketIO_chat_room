$("small").hide();
$("#join-spinner").hide();
$("#suff-spinner").hide();
$("#host-spinner").hide();
$("#group-call-spinner").hide();
for(let i = 128512; i <= 128567; i++){
    $("#icon-list").append('<button id="icon_' + i + '" class="btn btn-light" style="width:20%; font-size:x-large" onclick="addIcon(\icon_' + i + '\)">&#' + i +';</button>')
}

//128512 -> 128567
//VD: &#129409;
var timerClock
function timerStart(){
    var sec = 0
    function pad(val) { return val > 9 ? val : "0" + val; }
    timerClock = setInterval(function () {
        $("#call-seconds").html(pad(++sec % 60));
        $("#call-minutes").html(pad(parseInt(sec / 60, 10)));
    }, 1000);
    return;
}
function timerStop(){
    clearInterval(timerClock)
    $("#call-seconds").html('00');
    $("#call-minutes").html('00');
}
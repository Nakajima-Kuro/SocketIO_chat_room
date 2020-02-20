//0: Light Theme
//1: Dark Theme
var currentTheme = 0;
function changeTheme(){
    switch(currentTheme){
        case 0:{
            $(".theme-body-light").map(function() {
                $(this).removeClass('theme-body-light').addClass('theme-body-dark')
            });
            $(".theme-header-light").map(function() {
                $(this).removeClass('theme-header-light').addClass('theme-header-dark')
            });
            $(".theme-text-light").map(function() {
                $(this).removeClass('theme-text-light').addClass('theme-text-dark')
            });
            $(".theme-content-light").map(function() {
                $(this).removeClass('theme-content-light').addClass('theme-content-dark')
            });
            $("#button-section").find('button').removeClass('btn-info').addClass('btn-outline-info')
            $("#send").removeClass('btn-info').addClass('btn-outline-info')
            currentTheme = 1
            break;
        }
        case 1:{
            $(".theme-body-dark").map(function() {
                $(this).removeClass('theme-body-dark').addClass('theme-body-light')
            });
            $(".theme-header-dark").map(function() {
                $(this).removeClass('theme-header-dark').addClass('theme-header-light')
            });
            $(".theme-text-dark").map(function() {
                $(this).removeClass('theme-text-dark').addClass('theme-text-light')
            });
            $(".theme-content-dark").map(function() {
                $(this).removeClass('theme-content-dark').addClass('theme-content-light')
            });
            $("#button-section").find('button').removeClass('btn-outline-info').addClass('btn-info')
            $("#send").removeClass('btn-outline-info').addClass('btn-info')
            currentTheme = 0
            break;
        }
    }
}
function changeTheme() {
    switch ($.cookie("theme")) {
        case 'light': {//light => dark
            lightToDark()
            break;
        }
        case 'dark': {//dark => light
            darkToLight()
            break;
        }
        default: {
            break;
        }
    }
}

function lightToDark() {
    $('#theme-icon').attr('src', 'assets/images/moon.svg')
    $(".theme-body-light").map(function () {
        $(this).removeClass('theme-body-light').addClass('theme-body-dark')
    });
    $(".theme-header-light").map(function () {
        $(this).removeClass('theme-header-light').addClass('theme-header-dark')
    });
    $(".theme-text-light").map(function () {
        $(this).removeClass('theme-text-light').addClass('theme-text-dark')
    });
    $(".theme-headline").map(function () {
        $(this).removeClass('text-dark').addClass('text-info')
    });
    $(".theme-content-light").map(function () {
        $(this).removeClass('theme-content-light').addClass('theme-content-dark')
    });
    $('.theme-modal-outline').addClass('border-0')
    $("#button-section").find('button').removeClass('btn-info').addClass('btn-outline-info')
    $("#send").removeClass('btn-info').addClass('btn-outline-info')
    $('.theme-emoji-light').removeClass('theme-emoji-light').addClass('theme-emoji-dark btn-outline-info border-info')
    $('.theme-input').addClass('border-info')
    $('.theme-main-section').addClass('border-info')
    $('.theme-btn').addClass('theme-btn-dark')
    $('.theme-modal-header').addClass('theme-modal-header-dark')
    $('.theme-modal-footer').addClass('theme-modal-footer-dark')
    $('.theme-cross').addClass('theme-cross-dark')
    $.cookie("theme", "dark", { expires: 7 });
}

function darkToLight() {
    $('#theme-icon').attr('src', 'assets/images/sunny.svg')
    $(".theme-body-dark").map(function () {
        $(this).removeClass('theme-body-dark').addClass('theme-body-light')
    });
    $(".theme-header-dark").map(function () {
        $(this).removeClass('theme-header-dark').addClass('theme-header-light')
    });
    $(".theme-headline").map(function () {
        $(this).removeClass('text-info').addClass('text-dark')
    });
    $(".theme-text-dark").map(function () {
        $(this).removeClass('theme-text-dark').addClass('theme-text-light')
    });
    $(".theme-content-dark").map(function () {
        $(this).removeClass('theme-content-dark').addClass('theme-content-light')
    });
    $('.theme-modal-outline').removeClass('border-0')
    $('.theme-btn').removeClass('theme-btn-dark')
    $("#button-section").find('button').removeClass('btn-outline-info').addClass('btn-info')
    $("#send").removeClass('btn-outline-info').addClass('btn-info')
    $('.theme-emoji-dark').removeClass('theme-emoji-dark btn-outline-info border-info').addClass('theme-emoji-light')
    $('.theme-input').removeClass('border-info')
    $('.theme-main-section').removeClass('border-info')
    $('.theme-modal-header').removeClass('theme-modal-header-dark')
    $('.theme-modal-footer').removeClass('theme-modal-footer-dark')
    $('.theme-cross').removeClass('theme-cross-dark')
    $.cookie("theme", "light", { expires: 7 });
}
//bootstrap4 tooltips
$(function() {
    $('[data-toggle="tooltip"]').tooltip();
});

$(window).scroll(function() {
    $('#to-top').hide();
    if ($(window).scrollTop() >= 600) {
        $('#to-top').show();
    };
});
$("#to-top").click(function() {
    var speed = 400;
    $('body,html').animate({ scrollTop: 0 }, speed);
    return false;
});


$(function() {
    var $dropdownLi = $('ul.navbar-nav > li.dropdown');
    $dropdownLi.mouseover(function() {
        $(this).addClass('show');
        $(this).children('a.dropdown-toggle').attr('aria-expanded', 'true');
        $(this).children('div.dropdown-menu').addClass('show')
    }).mouseout(function() {
        $(this).removeClass('show');
        $(this).children('a.dropdown-toggle').attr('aria-expanded', 'false');
        $(this).children('div.dropdown-menu').removeClass('show')
    });
});


function TOC_FUN(A) {
    $(A).click(function() {
        $(A).css("color", "#0099ff");
        $(this).css("color", "red");
        $('html, body').animate({
            scrollTop: $($.attr(this, 'href')).offset().top - 55
        }, 500);
        return false;
    });
}
$(TOC_FUN('.toc a,.to-com'));


$(".article-body img").click(function() {
    var _src = this.src;
    $("#img-to-big img")[0].src = _src;
    $("#img-to-big").modal('show');
});

function addDarkTheme() {
    var link = document.createElement('link');
    link.type = 'text/css';
    link.id = "theme-css-dark";
    link.rel = 'stylesheet';
    link.href = '/css/night.css';
    $("head").append(link);
}

function removeDarkTheme() {
    $('#theme-css-dark').remove();
}


$("#theme-img").click(function() {
    var theme_key = "toggleTheme";
    var theme_value = Cookies.get(theme_key);
    if (theme_value == "dark") {
        $("#theme-img").attr("src", "/img/toggle-light.png");
        Cookies.set(theme_key, "light", { expires: 180, path: '/' });
        removeDarkTheme();
    } else {
        $("#theme-img").attr("src", "/img/toggle-dark.png");
        Cookies.set(theme_key, "dark", { expires: 180, path: '/' });
        addDarkTheme();
    }
});
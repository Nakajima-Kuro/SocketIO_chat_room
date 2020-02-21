class Queue {
    constructor() {
        this.queue = []
    }
    push(item) {
        this.queue.push(item)
    }
    pop() {
        var item = this.queue[0]
        this.queue.splice(0, 1)
        return item;
    }
    top() {
        return this.queue[0]
    }
    size() {
        return this.queue.length
    }
    remove(item) {
        var index = this.queue.indexOf(item);
        if (index != -1) {
            this.queue.splice(index, 1)
        }
    }
}

//0: Light Theme
//1: Dark Theme

$("small").hide();
$("#join-spinner").hide();
$("#suff-spinner").hide();
$("#host-spinner").hide();
$("#group-call-spinner").hide();
for (let i = 128512; i <= 128567; i++) {
    $("#icon-list").append('<button id="icon_' + i + '" class="btn btn-light" style="width:20%; font-size:x-large" onclick="addIcon(\icon_' + i + '\)">&#' + i + ';</button>')
}

//128512 -> 128567
//VD: &#129409;

// lock scroll position, but retain settings for later
var scrollPosition = [
    self.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft,
    self.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop
];

var html = jQuery('html'); // it would make more sense to apply this to body, but IE7 won't have that
html.data('scroll-position', scrollPosition);
html.data('previous-overflow', html.css('overflow'));
html.css('overflow', 'hidden');
$("html,body").animate({ scrollTop: 0 }, 'fast');
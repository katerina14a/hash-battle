TweetManager = {
    hashtags: [],
    get_hashtags: function () {
        $.ajax('/fetch_hashtags', {
            dataType: "json",
            success: function (data) {
                TweetManager.hashtags = data.hashtags;
            },
            complete: function () {
                var span;
                if (TweetManager.hashtags.length === 2) {
                    span = 6;
                } else if (TweetManager.hashtags.length === 3) {
                    span = 4;
                } else if (TweetManager.hashtags.length === 4) {
                    span = 3;
                }
                for (var i = 0; i < TweetManager.hashtags.length; i++) {
                    // TODO: make sure the span is correct
                    // TODO: make sure counters are displaying count
                    $('#tweets').append('<div id="t' + i + '" class="col-xs-' + span + ' tweets"></div>');
                    $('#counters').append('<div id="counter' + i + '" class="col-xs-' + span + ' counter">' +
                        '<h2>' + TweetManager.hashtags[i] + '</h2>' +
                        '<h2 id="c' + i + '" class="counter-style">0</h2>' +
                        '</div>');


                    TweetManager.get_new_tweet(TweetManager.hashtags[i], i);
                }
            }
        })
    },
    get_new_tweet: function (hash, id) {
        $.ajax('/fetch_tweet', {
            data: {'data': hash},
            dataType: "json",
            statusCode: {
                404: function () {
                    alert("page not found");
                },
                500: function () {
                    console.log("500 error in get_new_tweet");
                }
            },
            success: function (data) {
                if (data != {}) {
                    for (var i = 0; i < Object.keys(data).length; i++) {
                        if (data[hash + i.toString()] != '') {
                            $("#t" + id).prepend('<p class="tweet">' + data[hash + i.toString()] + '</p>');
                        }
                        var counter = $('#c' + id);
                        counter.html(parseInt(counter.html(), 10) + 1);
                    }
                }
                setTimeout(function () {
                    TweetManager.get_new_tweet(hash, id);
                }, 1000);
            },
            error: function (hash) {
                console.log("an error has occurred and we have stopped looking for tweets :( ")
            }
        });
    },
    draw_graph: function () {
        var chart = new Highcharts.Chart({
            chart: {
                renderTo: 'container'
            },
            title: {
                text: 'Number of tweets for each hash',
                x: -20 //center
            },
            xAxis: {
//                categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                categories: [],
                min: 6
            },
            legend: {
                verticalAlign: 'top',
                y: 100,
                align: 'right'
            },
            scrollbar: {
                enabled: true
            },
            series: [
                {
                    // name will be the hashtag name
                    name: "",
//                    data: [29.9, 71.5, 106.4, 129.2, 144.0, 176.0, 135.6, 148.5, 216.4, 194.1, 95.6, 54.4]
                    data: []
                }
            ]
        });
    }
};


$(document).ready(function () {

    $('.carousel').carousel({
        interval: false
    });

    TweetManager.draw_graph();

    $('#add-hashtag').click(function () {
        if ($('#hashtag-fields').children().length > 4) {
        } else {
            if ($('#hashtag-fields').children().length === 2) {
                $('#hashtag-fields').append(
                    '<div class="form-group">' +
                        '<label for="hashtag-3" class="col-xs-2 control-label">Hashtag#</label>' +
                        '<div class="col-xs-9">' +
                        '<input name="hash3" type="text" class="form-control" id="hashtag-3" placeholder="eg. birds">' +
                        '</div>' +
                        '<a href="#" id="group3" class="col-xs-1 remove-hashtag"  data-toggle="tooltip" data-placement="top" title="Remove from battle">X</a>' +
                        '</div>'
                );
                $('#explain-limit-text').remove();
            } else {
                $('#hashtag-fields').append(
                    '<div class="form-group">' +
                        '<label for="hashtag-4" class="col-xs-2 control-label">Hashtag#</label>' +
                        '<div class="col-xs-9">' +
                        '<input name="hash4" type="text" class="form-control" id="hashtag-4" placeholder="eg. bunnies">' +
                        '</div>' +
                        '<a href="#" id="group4" class="col-xs-1 remove-hashtag"  data-toggle="tooltip" data-placement="top" title="Remove from battle">X</a>' +
                        '</div>'
                );
                $('#add-hashtag').remove();
                $('#submit-hashtags').before('<p id="explain-limit-text" class="help-block col-sm-10 col-sm-offset-2">' +
                    'Sorry! As of now, Hash Battle only supports up to 4 hashtags.</p>');
            }
        }
    });

    $('#group1').click(function () {
        remove_group(this);
    });

    $('#group2').click(function () {
        remove_group(this);
    });

    $('#group3').click(function () {
        remove_group(this);
    });

    $('#group4').click(function () {
        remove_group(this);
    });

    var remove_group = function (div) {
        if ($('#hashtag-fields').children().length === 2) {
            $('#explain-limit-text').remove();
            $('#submit-hashtags').before('<p id="explain-limit-text" class="help-block col-sm-10 col-sm-offset-2">' +
                'There must be at least 2 hashtags in the battle</p>');
        } else {
            // remove the form group that contains the X that was clicked
            div.parent().remove();
            $('#add-hashtag').remove();
            $('#submit-hashtags').before(
                '<div id="add-hashtag" class="col-sm-10 col-sm-offset-2">' +
                    '<a href="#">+ Add Another Hashtag to the battle</a>' +
                    '</div>'
            );
            $('#explain-limit-text').remove();
        }
    };

    $('#confirm-start-battle').click(function () {
        $('#confirm-start-battle').remove();
        TweetManager.get_hashtags();
    })

});

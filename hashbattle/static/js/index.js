TweetManager = {
    hashtags: [],
    categories: [],
    plot_points: [],
    get_hashtags: function () {
        $.ajax('/fetch_hashtags', {
            dataType: "json",
            success: function (data) {
                TweetManager.hashtags = data.hashtags;
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
                    $('#tweets').append('<div id="t' + i + '" class="col-xs-' + span + ' tweets"></div>');
                    $('#counters').append('<div id="counter' + i + '" class="col-xs-' + span + ' counter">' +
                        '<h2>' + TweetManager.hashtags[i] + '</h2>' +
                        '<h2 id="c' + i + '" class="counter-style">0</h2>' +
                        '</div>');

                    TweetManager.plot_points.push({name: TweetManager.hashtags[i], data: []});

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
                var dt = new Date();
                var time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
                var num_new_plot_points = 0;
                for (var i = 0; i < Object.keys(data).length; i++) {
                    if (data[hash + i.toString()] != '') {
                        $("#t" + id).prepend('<p class="tweet">' + data[hash + i.toString()] + '</p>');
                        var counter = $('#c' + id);
                        counter.html(parseInt(counter.html(), 10) + 1);
                        // put elements in new list to be added to the existing one
                        num_new_plot_points += 1;

                    }
                }

                console.log("num_new_plot_points= " + num_new_plot_points.toString());

                // add to the existing number of tweets in the last plot point
                for (var k = 0; k < TweetManager.plot_points.length; k++) {
                    if (TweetManager.plot_points[k].name === hash) {
//                        console.log(num_new_plot_points);
                        console.log(TweetManager.plot_points[k].data);

//                        var unique_points = [];
//                        $.each(TweetManager.plot_points[k].data, function (i, el) {
//                            if ($.inArray(el, unique_points) === -1) unique_points.push(el);
//                        });

                        if (TweetManager.plot_points[k].data.length === 0) {
                            TweetManager.plot_points[k].data.push(num_new_plot_points);
                        } else {
                            TweetManager.plot_points[k].data.push(num_new_plot_points + TweetManager.plot_points[k].data[TweetManager.plot_points[k].data.length - 1]);
                        }
                        break;
                    }
                }

                // add time if time not there already
                if (TweetManager.categories.indexOf(time) === -1) {
                    TweetManager.categories.push(time);
                    TweetManager.categories.sort();
                }
                console.log(TweetManager.plot_points[k].data);
                $('#graph').empty();
                TweetManager.draw_graph(TweetManager.categories, TweetManager.plot_points);

                setTimeout(function () {
                    TweetManager.get_new_tweet(hash, id);
                }, 3000);
            },
            error: function (hash) {
                console.log("an error has occurred and we have stopped looking for tweets :( ")
            }
        });
    },
    draw_graph: function (categories, data) {
        var chart = new Highcharts.Chart({
            chart: {
                renderTo: 'graph',
                zoomType: 'xy'
            },
            title: {
                text: 'Number of tweets for each hash',
                x: -20 //center
            },
            xAxis: {
//                categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                categories: categories,
                min: 1,
                max: 20
            },
            yAxis: {
                min: 0,
                title: {
                    text: 'Total Tweets'
                }
            },
            legend: {
                verticalAlign: 'top',
                y: 100,
                align: 'right',
                shadow: true
            },
            scrollbar: {
                enabled: true,
                barBackgroundColor: 'blue',
                barBorderRadius: 7,
                barBorderWidth: 0,
                buttonBackgroundColor: 'blue',
                buttonBorderWidth: 0,
                buttonArrowColor: 'white',
                buttonBorderRadius: 7,
                rifleColor: 'white',
                trackBackgroundColor: 'white',
                trackBorderWidth: 1,
                trackBorderColor: 'silver',
                trackBorderRadius: 7
            },
            connectNulls: true,
            series: data
//            series: [
//                {
//                    // name will be the hashtag name
//                    name: name,
////                    data: [29.9, 71.5, 106.4, 129.2, 144.0, 176.0, 135.6, 148.5, 216.4, 194.1, 95.6, 54.4]
//                    data: data
//                }
//            ]
        });
    }
};


$(document).ready(function () {

    $('.carousel').carousel({
        interval: false
    });


    $('#upper-limit-text').hide();
    $('#lower-limit-text').hide();
    $('#group1').parent().addClass("show");
    $('#group2').parent().addClass("show");
    $('#group3').parent().addClass("hidden");
    $('#group4').parent().addClass("hidden");


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

    $('#add-hashtag').click(function () {
        if ($('#hashtag-fields .show').length >= 4) {
        } else {
            if ($('#hashtag-fields .show').length === 2) {
                var div_to_add;
                if ($('#group1').parent().hasClass("hidden")) {
                    div_to_add = $('#group1');
                } else if ($('#group2').parent().hasClass("hidden")) {
                    div_to_add = $('#group2');
                } else if ($('#group3').parent().hasClass("hidden")) {
                    div_to_add = $('#group3');
                } else if ($('#group4').parent().hasClass("hidden")) {
                    div_to_add = $('#group4');
                }
                div_to_add.parent().removeClass("hidden");
                div_to_add.parent().addClass("show");
                $('#lower-limit-text').removeClass("show");
                $('#lower-limit-text').addClass("hidden");
            } else {
                if ($('#group1').parent().hasClass("hidden")) {
                    div_to_add = $('#group1');
                } else if ($('#group2').parent().hasClass("hidden")) {
                    div_to_add = $('#group2');
                } else if ($('#group3').parent().hasClass("hidden")) {
                    div_to_add = $('#group3');
                } else if ($('#group4').parent().hasClass("hidden")) {
                    div_to_add = $('#group4');
                }
                div_to_add.parent().removeClass("hidden");
                div_to_add.parent().addClass("show");
                $('#upper-limit-text').addClass("show");
                $('#upper-limit-text').removeClass("hidden");
                $('#add-hashtag').addClass("hidden");
                $('#add-hashtag').removeClass("show");
            }
        }
    });

    function remove_group(div) {
        if ($('#hashtag-fields .show').length === 2) {
            $('#lower-limit-text').removeClass("hidden");
            $('#lower-limit-text').addClass("show");
        } else {
            // remove the form group that contains the X that was clicked
            $(div).parent().removeClass("show");
            $(div).parent().addClass("hidden");
            $('#add-hashtag').removeClass("hidden");
            $('#add-hashtag').addClass("show");
            $('#upper-limit-text').removeClass("show");
            $('#upper-limit-text').addClass("hidden");
        }
    }

    $('#confirm-start-battle').click(function () {
        $('#confirm-start-battle').remove();
        TweetManager.get_hashtags();
    });
});

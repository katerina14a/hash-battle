TweetManager = {
    hashtags: [],
    plot_points: [],
    // returns hashtags and starts off new celery workers for each hashtag
    get_hashtags: function () {
        $.ajax('/fetch_hashtags', {
            dataType: "json",
            success: function (data) {
                TweetManager.hashtags = data.hashtags;

                while (TweetManager.hashtags.indexOf("") != -1) {
                    TweetManager.hashtags.splice(TweetManager.hashtags.indexOf(""), 1);
                }

                var span;
                if (TweetManager.hashtags.length === 2) {
                    span = 6;
                } else if (TweetManager.hashtags.length === 3) {
                    span = 4;
                } else if (TweetManager.hashtags.length === 4) {
                    span = 3;
                }

                for (var i = 0; i < TweetManager.hashtags.length; i++) {
                    $('#tweets').append('<div id="t' + i + '" class="col-xs-' + span + ' tweets">' +
                        '<p id="placeholder' + i + '" class="tweet-placeholder">waiting for tweets to come in...</p>' +
                        '</div>');

                    $('#counters').append('<div id="counter' + i + '" class="col-xs-' + span + ' counter">' +
                        '<h2>#' + TweetManager.hashtags[i] + '</h2>' +
                        '<h2 id="c' + i + '" class="counter-style">0</h2>' +
                        '</div>');

                    TweetManager.plot_points.push({name: "#" + TweetManager.hashtags[i].toString(), data: []});

                    TweetManager.get_new_tweet(TweetManager.hashtags[i], i);
                }
            }
        })
    },
    // celery worker brings in batches of tweets and then does it again until the battle ends
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

                // increase counter, remove placeholder, and add tweet to stream
                var num_new_plot_points = 0;
                for (var i = 0; i < Object.keys(data).length; i++) {
                    if (data[hash + i.toString()] != '') {
                        $("#placeholder" + id).remove();
                        $("#t" + id).prepend('<p class="tweet">' + data[hash + i.toString()] + '</p>');
                        var counter = $('#c' + id);
                        counter.html(parseInt(counter.html(), 10) + 1);
                        num_new_plot_points += 1;
                    }
                }

                // add to the existing number of tweets in the last plot point
                for (var k = 0; k < TweetManager.plot_points.length; k++) {
                    if (TweetManager.plot_points[k].name === "#" + hash.toString()) {
                        if (TweetManager.plot_points[k].data.length === 0) {
                            TweetManager.plot_points[k].data.push(num_new_plot_points);
                        } else {
                            TweetManager.plot_points[k].data.push(num_new_plot_points + TweetManager.plot_points[k].data[TweetManager.plot_points[k].data.length - 1]);
                        }
                        break;
                    }
                }

                // only redraw the graph if there have been more tweets
                // still add the unchanged count to preserve the slope of the graph
                if (num_new_plot_points != 0) {
                    $('#graph').empty();
                    TweetManager.draw_graph(TweetManager.plot_points);
                }

                // recursive call so worker keeps getting more tweets from cache
                setTimeout(function () {
                    TweetManager.get_new_tweet(hash, id);
                }, 2000);
            },
            error: function () {
                console.log("an error has occurred and we have stopped looking for tweets :( ")
            }
        });
    },
    // graph formed with Highcharts
    draw_graph: function (data) {
        var chart = new Highcharts.Chart({
            chart: {
                renderTo: 'graph',
                zoomType: 'xy',
                backgroundColor: '#f9f9f9'
            },
            title: {
                text: 'Number of tweets for each hash',
                x: -20 //center
            },
            xAxis: {
                min: 1
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
                shadow: true,
                layout: "vertical"
            },
            connectNulls: true,
            series: data
        });
    }
};


$(document).ready(function () {

    // needed to stop the bootstrap carousel from automatically spinning
    $('.carousel').carousel({
        interval: false
    });

    // initialize the submit button for the form to be disabled so user knows he can't click it
    $('#submit-hashtags').find('button').prop('disabled', true);

    // validate any time a key is pressed
    $('form').keypress(function () {
        validate_form();
    });

    function validate_form() {
        // hashes are alphanumeric characters
        var hash_regex = /^[A-Za-z0-9]+$/;

        var hash1 = $('#hashtag-1').val();
        var hash2 = $('#hashtag-2').val();
        var hash3 = $('#hashtag-3').val();
        var hash4 = $('#hashtag-4').val();

        var hash1_is_used = false;
        var hash2_is_used = false;
        var hash3_is_used = false;
        var hash4_is_used = false;

        var hash_list = [];

        if ($('#group1').parent().hasClass("show") && hash_regex.test(hash1)) {
            hash1_is_used = true;
            hash_list = hash_list.concat([hash1]);
        }
        if ($('#group2').parent().hasClass("show") && hash_regex.test(hash2)) {
            hash2_is_used = true;
            hash_list = hash_list.concat([hash2]);

        }
        if ($('#group3').parent().hasClass("show") && hash_regex.test(hash3)) {
            hash3_is_used = true;
            hash_list = hash_list.concat([hash3]);

        }
        if ($('#group4').parent().hasClass("show") && hash_regex.test(hash4)) {
            hash4_is_used = true;
            hash_list = hash_list.concat([hash4]);

        }

        // deduping array to make sure that all hashtags entered are unique
        var unique_hash_list = [];
        $.each(hash_list, function (i, el) {
            if ($.inArray(el, unique_hash_list) === -1) unique_hash_list.push(el);
        });

        var something_wrong = false;

        // if the items are not unique, the success state below will not be triggered
        var unique_text = $('#unique-hashes-text');
        if (hash_list.length != unique_hash_list.length) {
            something_wrong = true;
            unique_text.removeClass("hidden");
            unique_text.addClass("show");
            $('#submit-hashtags').find('button').prop('disabled', true);
        }

        // 2 fields must be in use
        var lower_limit_text = $('#lower-limit-text');
        if ((hash1_is_used ? 1 : 0) + (hash2_is_used ? 1 : 0) + (hash3_is_used ? 1 : 0) + (hash4_is_used ? 1 : 0) < 2) {
            unique_text.removeClass("show");
            unique_text.addClass("hidden");
            lower_limit_text.removeClass("hidden");
            lower_limit_text.addClass("show");
            $('#submit-hashtags').find('button').prop('disabled', true);
        } else if (!something_wrong) {
            lower_limit_text.removeClass("show");
            lower_limit_text.addClass("hidden");
            unique_text.removeClass("show");
            unique_text.addClass("hidden");
            $('#submit-hashtags').find('button').prop('disabled', false);
        }
    }

    // when pressing enter on the form, simulate a click on the submit button
    $(document).keypress(function (e) {
        if (e.which == 13) {
            $('#submit-hashtags').find('button').click();
        }
    });

    // handles clicking X near the form fields
    $('#group1').click(function () {
        remove_group(1);
    });

    $('#group2').click(function () {
        remove_group(2);
    });

    $('#group3').click(function () {
        remove_group(3);
    });

    $('#group4').click(function () {
        remove_group(4);
    });

    function remove_group(num_form_group) {
        if ($('#hashtag-fields').find('.show').length === 2) {
            var lower_limit_text = $('#lower-limit-text');
            lower_limit_text.removeClass("hidden");
            lower_limit_text.addClass("show");
        } else {
            // remove the form group that contains the X that was clicked
            var parent = $('#group' + num_form_group.toString()).parent();
            parent.removeClass("show");
            parent.addClass("hidden");
            $('#hashtag-' + num_form_group.toString()).val("");
            var add_tag = $('#add-hashtag');
            add_tag.removeClass("hidden");
            add_tag.addClass("show");
            var upper_limit_text = $('#upper-limit-text');
            upper_limit_text.removeClass("show");
            upper_limit_text.addClass("hidden");
        }
    }

    // handles clicking "Add new Hashtag"
    $('#add-hashtag').click(function () {
        if ($('#hashtag-fields').find('.show').length < 4) {
            var group1 = $('#group1');
            if ($('#hashtag-fields').find('.show').length === 2) {
                var div_to_add;
                if (group1.parent().hasClass("hidden")) {
                    div_to_add = group1;
                } else if ($('#group2').parent().hasClass("hidden")) {
                    div_to_add = $('#group2');
                } else if ($('#group3').parent().hasClass("hidden")) {
                    div_to_add = $('#group3');
                } else if ($('#group4').parent().hasClass("hidden")) {
                    div_to_add = $('#group4');
                }
                div_to_add.parent().removeClass("hidden");
                div_to_add.parent().addClass("show");
                var lower = $('#lower-limit-text');
                lower.removeClass("show");
                lower.addClass("hidden");
            } else {
                if (group1.parent().hasClass("hidden")) {
                    div_to_add = group1;
                } else if ($('#group2').parent().hasClass("hidden")) {
                    div_to_add = $('#group2');
                } else if ($('#group3').parent().hasClass("hidden")) {
                    div_to_add = $('#group3');
                } else if ($('#group4').parent().hasClass("hidden")) {
                    div_to_add = $('#group4');
                }
                div_to_add.parent().removeClass("hidden");
                div_to_add.parent().addClass("show");
            }
        } else {
            var upper = $('#upper-limit-text');
            upper.addClass("show");
            upper.removeClass("hidden");
            var add_tag = $('#add-hashtag');
            add_tag.addClass("hidden");
            add_tag.removeClass("show");
        }
    });



    // true when battle.html is loaded
    if ($('#battle-title').length) {

        // display a modal with the results of the hashtag battle
        $('#end-battle-btn').click(function () {
            var winners = [
                ["", 0]
            ];
            for (var i = 0; i < TweetManager.hashtags.length; i++) {
                var counter = $('#c' + i.toString());
                var num_tweets = parseInt(counter.html(), 10);
                if (winners.length > 1) {
                    if (num_tweets > winners[0][1]) {
                        winners = [
                            [TweetManager.hashtags[i], num_tweets]
                        ];
                    } else if (num_tweets === winners[0][1]) {
                        winners = winners.concat([
                            [TweetManager.hashtags[i], num_tweets]
                        ]);
                    }
                } else {
                    if (num_tweets > winners[0][1]) {
                        winners[0] = [TweetManager.hashtags[i], num_tweets];
                    } else if (num_tweets > 0 && num_tweets === winners[0][1]) {
                        winners = winners.concat([
                            [TweetManager.hashtags[i], num_tweets]
                        ]);
                    }
                }
            }

            if (winners.length === 1) {
                if (winners[0][0] === "") {
                    $('#battle-modal-content').html('<h3>No winners</h3>' +
                        '<p>These hashtags have not been tagged in any tweets yet :(</p>');
                } else {
                    $('#battle-modal-content').html('<h3>#' + winners[0][0] + ' is the winner!</h3>' +
                        '<p>tagged in ' + winners[0][1] + ' tweets</p>');
                }
            } else {
                var tied_winners = "";
                for (var k = 0; k < winners.length; k++) {
                    if (k === winners.length - 1) {
                        tied_winners = tied_winners.concat("#" + winners[k][0]);
                    } else {
                        tied_winners = tied_winners.concat("#" + winners[k][0] + ", ");
                    }
                }
                $('#battle-modal-content').html('<h3>' + tied_winners + '</h3>' +
                    '<p>are all winners, tagged in ' + winners[0][1] + ' tweets</p>');
            }
        });

        // start off the ajax requests by retrieving the hashtags
        setTimeout(function () {
            TweetManager.get_hashtags();
        }, 100);
    }
});

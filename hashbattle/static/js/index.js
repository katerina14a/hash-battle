TweetManager = {
    hashtags: [],
    get_hashtags: function () {
        $.ajax('/fetch_hashtags', {
            dataType: "json",
            success: function (data) {
                TweetManager.hashtags = data.hashtags;
            },
            complete: function () {
                for (var i = 0; i < TweetManager.hashtags.length; i++) {
                    $('#tweets').append('<div id="t' + i + '"></div>');
                    TweetManager.get_new_tweet(TweetManager.hashtags[i], "#t" + i);
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
                            $(id).prepend('<p>' + data[hash + i.toString()] + '</p>');
                        }
                    }
                }
                setTimeout(function () {
                    TweetManager.get_new_tweet(hash, id);
                }, 4000);
            },
            error: function (hash) {
                console.log("an error has occured and we have stopped looking for tweets :( ")
            }
        });
    }
};


$(document).ready(function () {
    $('#confirm-start-battle').click(function () {
        $('#confirm-start-battle').remove();
        TweetManager.get_hashtags();
    })
});

//function getData()
//{
//    loadXMLDoc("Service.aspx");
//}
//
//var req = false;
//function createRequest() {
//    req = new XMLHttpRequest(); // http://msdn.microsoft.com/en-us/library/ms535874%28v=vs.85%29.aspx
//}
//
//function loadXMLDoc(url) {
//    try {
//        if (req) {
//            req.abort();
//            req = false;
//        }
//
//        createRequest();
//
//        if (req) {
//            req.onreadystatechange = processReqChange;
//            req.open("GET", url, true);
//            req.send("");
//        } else {
//            alert('unable to create request');
//        }
//    } catch (e) {
//        alert(e.message);
//    }
//}
//
//function processReqChange() {
//    if (req.readyState == 3) {
//        try {
//            ProcessInput(req.responseText);
//
//            // At some (artibrary) length   recycle the connection
//            if (req.responseText.length > 3000) { lastDelimiterPosition = -1; getData(); }
//        }
//        catch (e) { alert(e.message); }
//    }
//}
//
//var lastDelimiterPosition = -1;
//function ProcessInput(input) {
//    // Make a copy of the input
//    var text = input;
//
//    // Search for the last instance of the delimiter
//    var nextDelimiter = text.indexOf('|', lastDelimiterPosition + 1);
//    if (nextDelimiter != -1) {
//
//        // Pull out the latest message
//        var timeStamp = text.substring(nextDelimiter + 1);
//        if (timeStamp.length > 0) {
//            lastDelimiterPosition = nextDelimiter;
//            document.getElementById('outputZone').innerHTML = timeStamp;
//        }
//    }
//}
//
//window.onload = function () { getData(); };

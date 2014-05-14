# import json
import json
from app.settings import LOGOUT_REDIRECT_URL
import os
from django.core.cache import cache
from django.shortcuts import render_to_response
from app.celery import save_tweets
from twython import Twython

from django.contrib.auth import authenticate, login, logout as django_logout
from django.contrib.auth import get_user_model
from django.http import HttpResponseRedirect, HttpResponse
from django.conf import settings
from django.core.urlresolvers import reverse


User = get_user_model()


# If you've got your own Profile setup, see the note in the models file
# about adapting this to your own setup.
from twython_django_oauth.models import TwitterProfile

# def get_tweet(request):
#     """
#     :param request: GET request from an AJAX call in index.js passing in .............
#     :return:
#     """
#     tag = request.GET
#     rtn = {
#         'title': title,
#         'menus': menus,
#         'prev': prev_id,
#         'next': next_id,
#     }
#     return HttpResponse(json.simplejson.dumps(rtn), mimetype="application/json")

def set_hashtags(request):
    if 'hash1' in request.GET:
        hash1 = str(request.GET['hash1'])
    if 'hash2' in request.GET:
        hash2 = str(request.GET['hash2'])

    # hashes = request.session.get('hashes')
    # if not hashes:
    #     hashes = []
    request.session['hashes'] = [hash1, hash2]
    print [hash1, hash2]

    user = request.user.twitterprofile
    # call the following 2 lines for each hashtag the user chose in the beginning page
    token = user.oauth_token
    secret = user.oauth_secret

    # remove any tweets in memcached to start fresh
    cache.delete(hash1)
    cache.delete(hash2)

    # start the aggregation of tweets into memcache using celery tasks
    save_tweets.delay(hash1, token, secret)
    save_tweets.delay(hash2, token, secret)
    return render_to_response('battle.html')

def fetch_hashtags(request):
    response = {"hashtags": []}
    hashes = request.session.get('hashes')
    for i in range(0, len(hashes)):
        response["hashtags"].append(hashes[i])
    return HttpResponse(json.dumps(response), content_type="application/json")

def fetch_tweet(request):
    if 'data' in request.GET:
        hashtag = str(request.GET['data'])

    # using memcached as a locking mechanism
    if cache.add("lock:hashtaglock", "1", 300):
        try:
            if cache.get(hashtag) is None:
                return HttpResponse(json.dumps({}), content_type="application/json")
            tweets = cache.get(hashtag)
            cache.delete(hashtag)
            response = {}
            for idx, tweet in enumerate(tweets):
                # {"cat1" : "I love #cats", ...}
                response[hashtag + str(idx)] = tweet
        finally:
            cache.delete("lock:hashtaglock")
        return HttpResponse(json.dumps(response), content_type="application/json")
    else:
        # log this
        return HttpResponse(json.dumps({}), content_type="application/json")


def logout(request, redirect_url=settings.LOGOUT_REDIRECT_URL):
    """
        Nothing hilariously hidden here, logs a user out. Strip this out if your
        application already has hooks to handle this.
    """
    django_logout(request)
    return HttpResponseRedirect(request.build_absolute_uri(redirect_url))


def begin_auth(request):
    """The view function that initiates the entire handshake.

    For the most part, this is 100% drag and drop.
    """
    # Instantiate Twython with the first leg of our trip.
    twitter = Twython(settings.TWITTER_KEY, settings.TWITTER_SECRET)

    # Request an authorization url to send the user to...
    # callback_url = request.build_absolute_uri(reverse('twython_django_oauth.views.thanks'))
    callback_url = request.build_absolute_uri(reverse('hashbattle.views.thanks'))
    auth_props = twitter.get_authentication_tokens(callback_url)

    # Then send them over there, durh.
    request.session['request_token'] = auth_props
    return HttpResponseRedirect(auth_props['auth_url'])


def thanks(request, redirect_url=settings.LOGIN_REDIRECT_URL):
    """A user gets redirected here after hitting Twitter and authorizing your app to use their data.

    This is the view that stores the tokens you want
    for querying data. Pay attention to this.

    """
    # Now that we've got the magic tokens back from Twitter, we need to exchange
    # for permanent ones and store them...
    oauth_token = request.session['request_token']['oauth_token']
    oauth_token_secret = request.session['request_token']['oauth_token_secret']
    twitter = Twython(settings.TWITTER_KEY, settings.TWITTER_SECRET,
                      oauth_token, oauth_token_secret)

    # Retrieve the tokens we want...
    authorized_tokens = twitter.get_authorized_tokens(request.GET['oauth_verifier'])

    # If they already exist, grab them, login and redirect to a page displaying stuff.
    try:
        user = User.objects.get(username=authorized_tokens['screen_name'])
        user.set_password(authorized_tokens['oauth_token_secret'])
        user.save()
    except User.DoesNotExist:
        # We mock a creation here; no email, password is just the token, etc.
        user = User.objects.create_user(authorized_tokens['screen_name'], "fjdsfn@jfndjfn.com", authorized_tokens['oauth_token_secret'])
        profile = TwitterProfile()
        profile.user = user
        profile.oauth_token = authorized_tokens['oauth_token']
        profile.oauth_secret = authorized_tokens['oauth_token_secret']
        profile.save()

    user = authenticate(
        username=authorized_tokens['screen_name'],
        password=authorized_tokens['oauth_token_secret']
    )
    login(request, user)
    return HttpResponseRedirect(redirect_url)


def user_timeline(request):
    """An example view with Twython/OAuth hooks/calls to fetch data about the user in question."""
    user = request.user.twitterprofile
    twitter = Twython(settings.TWITTER_KEY, settings.TWITTER_SECRET,
                      user.oauth_token, user.oauth_secret)
    user_tweets = twitter.get_home_timeline()
    return render_to_response('tweets.html', {'tweets': user_tweets})

def battle(request):
    return render_to_response('battle.html')

# Create your views here.
def home(request):
    return render_to_response('home.html')

def end_battle(request):
    bash_command = "ps auxww | grep 'celery' | awk '{print $2}' | xargs kill -9"
    os.system(bash_command)
    # django_logout(request)
    return HttpResponseRedirect(request.build_absolute_uri(LOGOUT_REDIRECT_URL))
    # return HttpResponse(json.dumps({}), content_type="application/json")
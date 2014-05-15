import json
import re
from app.settings import LOGOUT_REDIRECT_URL
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

def set_hashtags(request):

    cache.delete("stop:tasks")

    # TODO: handle less than 2 hashes
    hash1 = ""
    hash2 = ""
    hash3 = ""
    hash4 = ""

    request.session['hashes'] = []

    # get the hashtag if it was passed in
    # strip it of any non alphanumeric characters
    # save it to the session
    if 'hash1' in request.GET:
        hash1 = str(request.GET['hash1'])
        hash1 = re.sub('[^0-9a-zA-Z]+', '', hash1)
        request.session['hashes'].append(hash1)
    if 'hash2' in request.GET:
        hash2 = str(request.GET['hash2'])
        hash2 = re.sub('[^0-9a-zA-Z]+', '', hash2)
        request.session['hashes'].append(hash2)
    if 'hash3' in request.GET:
        hash3 = str(request.GET['hash3'])
        hash3 = re.sub('[^0-9a-zA-Z]+', '', hash3)
        request.session['hashes'].append(hash3)
    if 'hash4' in request.GET:
        hash4 = str(request.GET['hash4'])
        hash4 = re.sub('[^0-9a-zA-Z]+', '', hash4)
        request.session['hashes'].append(hash4)

    # get user data to be able to make the twitter api request
    user = request.user.twitterprofile
    token = user.oauth_token
    secret = user.oauth_secret

    # remove tweets for the hash already in memcached to start fresh
    # start the aggregation of tweets into memcached using celery tasks
    if hash1 != "":
        cache.delete(hash1)
        save_tweets.delay(hash1, token, secret)
    if hash2 != "":
        cache.delete(hash2)
        save_tweets.delay(hash2, token, secret)
    if hash3 != "":
        cache.delete(hash3)
        save_tweets.delay(hash3, token, secret)
    if hash4 != "":
        cache.delete(hash4)
        save_tweets.delay(hash4, token, secret)

    return render_to_response('battle.html')

def fetch_hashtags(request):
    response = {"hashtags": []}
    hashes = request.session.get('hashes')
    # TODO: if hashes = [], take them back to homepage to enter in the hashes again (error with session)
    for i in range(0, len(hashes)):
        response["hashtags"].append(hashes[i])
    return HttpResponse(json.dumps(response), content_type="application/json")

def fetch_tweet(request):
    if 'data' in request.GET:
        hashtag = str(request.GET['data'])

    # using memcached as a locking mechanism to access the tweets
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
        # celery has been shutdown
        return HttpResponse(json.dumps({}), content_type="application/json")


def logout(request, redirect_url=settings.LOGOUT_REDIRECT_URL):
    """
        Nothing hilariously hidden here, logs a user out. Strip this out if your
        application already has hooks to handle this.
    """
    django_logout(request)
    return HttpResponseRedirect(request.build_absolute_uri(redirect_url))


def begin_auth(request):
    # Instantiate Twython
    twitter = Twython(settings.TWITTER_KEY, settings.TWITTER_SECRET)

    # Request an authorization url to send the user to
    callback_url = request.build_absolute_uri(reverse('hashbattle.views.thanks'))
    auth_props = twitter.get_authentication_tokens(callback_url)

    # Then send them over there
    request.session['request_token'] = auth_props
    return HttpResponseRedirect(auth_props['auth_url'])


def thanks(request, redirect_url=settings.LOGIN_REDIRECT_URL):
    # tokens obtained from Twitter
    oauth_token = request.session['request_token']['oauth_token']
    oauth_token_secret = request.session['request_token']['oauth_token_secret']
    twitter = Twython(settings.TWITTER_KEY, settings.TWITTER_SECRET,
                      oauth_token, oauth_token_secret)

    # retrieving tokens
    authorized_tokens = twitter.get_authorized_tokens(request.GET['oauth_verifier'])

    # if tokens already exist, use them to login and redirect to the battle
    try:
        user = User.objects.get(username=authorized_tokens['screen_name'])
        user.set_password(authorized_tokens['oauth_token_secret'])
        user.save()
    except User.DoesNotExist:
        # mock a creation here; no email, password is just the token, etc. since no need for users in this app
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

def battle(request):
    return render_to_response('battle.html')

def home(request):
    return render_to_response('home.html')

def end_battle(request):
    # shutdown tasks
    if cache.add("lock:hashtaglock", "1", 300):
        try:
            cache.add("stop:tasks", "1")
        finally:
            cache.delete("lock:hashtaglock")
    else:
        pass

    # bash_command = "ps auxww | grep 'celery' | awk '{print $2}' | xargs kill -9"
    # os.system(bash_command)
    return HttpResponseRedirect(request.build_absolute_uri(LOGOUT_REDIRECT_URL))
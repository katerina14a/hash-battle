from __future__ import absolute_import
from Queue import Queue
from TwitterAPI import TwitterAPI
from app import settings
from django.core.cache import cache
from app.celery import cel
from celery import shared_task


@cel.task
def save_tweets(hashtag, token, secret):
    # f = open('/tmp/' + hashtag + '.csv', 'w')
    # file = File(f)
    queue = Queue()
    cache.set(hashtag, queue, 604800)
    # user = request.user.twitterprofile
    api = TwitterAPI(settings.TWITTER_KEY, settings.TWITTER_SECRET, token, secret)
    r = api.request('statuses/filter', {'track': 'beach'})
    for item in r:
        queue.put(item['text'] if 'text' in item else item)

@shared_task
def add(x, y):
    return x + y


@shared_task
def mul(x, y):
    return x * y


@shared_task
def xsum(numbers):
    return sum(numbers)
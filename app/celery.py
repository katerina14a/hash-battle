from __future__ import absolute_import
import sys

import os

from celery import Celery

from django.conf import settings

# set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app.settings')

cel = Celery('app')

# Using a string here means the worker will not have to
# pickle the object when using Windows.
cel.config_from_object('django.conf:settings')
cel.autodiscover_tasks(lambda: settings.INSTALLED_APPS)


@cel.task(bind=True)
def debug_task(self):
    print('Request: {0!r}'.format(self.request))


from django.core.cache import cache
from TwitterAPI import TwitterAPI

@cel.task
def save_tweets(hashtag, token, secret):
    api = TwitterAPI(settings.TWITTER_KEY, settings.TWITTER_SECRET, token, secret)

    # actual line to use is the first one but for purposes of debugging, more results without the #
    r = api.request('statuses/filter', {'track': '#' + hashtag})
    # r = api.request('statuses/filter', {'track': hashtag})

    for item in r:
        # print item['text'] if 'text' in item else item

        # using memcached as a locking mechanism
        if cache.add("lock:hashtaglock", "1", 300):
            try:
                if cache.get("stop:tasks") == "1":
                    break
                if cache.get(hashtag) is not None:
                    tmp_list = cache.get(hashtag)
                    tmp_list.append(item['text'] if 'text' in item else item)
                    cache.set(hashtag, tmp_list, 604800)
                else:
                    tweets = [item['text'] if 'text' in item else item]
                    # queue.put(item['text'] if 'text' in item else item)
                    cache.set(hashtag, tweets, 604800)
            finally:
                cache.delete("lock:hashtaglock")
                # print hashtag + ': ' + str(len(cache.get(hashtag)))
                # print 'cache is taking up ' + str(sys.getsizeof(cache)/(1024.0*1024.0)) + 'MB'
        else:
            # log this
            pass

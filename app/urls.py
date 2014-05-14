from django.conf.urls import patterns, include, url

from django.contrib import admin

admin.autodiscover()

urlpatterns = patterns('hashbattle.views',
    url(r'^$', 'begin_auth'),
    url(r'^home/$', 'home'),
    url(r'^set_hashtags/$', 'set_hashtags'),
    url(r'^fetch_tweet/$', 'fetch_tweet'),
    url(r'^fetch_hashtags/$', 'fetch_hashtags'),
    url(r'^battle/$', 'battle'),
    url(r'^end_battle/$', 'end_battle'),
    url(r'^login/?$', "begin_auth", name="twitter_login"),
    url(r'^logout/?$', "logout", name="twitter_logout"),

    # where a user is redirected to after authorizing
    url(r'^thanks/?$', "thanks", name="twitter_callback"),

    url(r'^admin/', include(admin.site.urls)),
)

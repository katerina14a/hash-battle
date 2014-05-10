from django.conf.urls import patterns, include, url

from django.contrib import admin

admin.autodiscover()

urlpatterns = patterns('hashbattle.views',
    # Examples:
    url(r'^$', 'begin_auth'),
    url(r'^home/$', 'home'),
    url(r'^set_hashtags/$', 'set_hashtags'),
    url(r'^fetch_tweet/$', 'fetch_tweet'),
    url(r'^fetch_hashtags/$', 'fetch_hashtags'),
    url(r'^battle/$', 'battle'),
    # url(r'^blog/', include('blog.urls')),
    url(r'^login/?$', "begin_auth", name="twitter_login"),
    url(r'^logout/?$', "logout", name="twitter_logout"),

    # This is where they're redirected to after authorizing - we'll
    # further (silently) redirect them again here after storing tokens and such.
    url(r'^thanks/?$', "thanks", name="twitter_callback"),

    # An example view using a Twython method with proper OAuth credentials. Clone
    # this view and url definition to get the rest of your desired pages/functionality.
    url(r'^user_timeline/?$', "user_timeline", name="twitter_timeline"),

    url(r'^admin/', include(admin.site.urls)),
)

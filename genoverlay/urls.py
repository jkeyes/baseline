from django.conf.urls.defaults import patterns, include, url

urlpatterns = patterns('',
    url(r'^$', 'genoverlay.views.overlay', name='home'),
)

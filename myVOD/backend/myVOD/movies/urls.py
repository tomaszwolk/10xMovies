"""
URL configuration for movies app.
"""
from django.urls import path
from . import views

urlpatterns = [
    path('', views.MovieSearchView.as_view(), name='movie-search'),
]

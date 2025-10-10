from django.contrib import admin
from .models import Movie, Platform, UserMovie  # Zaimportuj wszystkie modele, którymi chcesz zarządzać

admin.site.register(Movie)
admin.site.register(Platform)
admin.site.register(UserMovie)

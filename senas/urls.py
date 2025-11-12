from django.contrib import admin
from django.urls import path
from iamodel import views # Importa tus vistas

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Ruta para la API
    path('api/predict/', views.predict_sign, name='predict_sign'),
    
    path('api/predict_emotion/', views.predict_emotion, name='predict_emotion'),
    
    # Ruta principal que sirve el frontend
    path('', views.index, name='index'),
]
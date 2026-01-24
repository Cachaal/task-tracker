from django.urls import path


from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("customization", views.customization, name="customization"),
    path("add-tasks", views.create, name="add-tasks"),
    path("manage-habit", views.manage_habit, name="manage-habit"),
    path("history", views.history, name="history"),
    path("summary", views.summary, name="summary")
]
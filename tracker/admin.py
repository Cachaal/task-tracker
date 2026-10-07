from django.contrib import admin
from .models import Task, Tracking, User
# Register your models here.


class BookAdmin(admin.ModelAdmin):
    readonly_fields = ('id',)

admin.site.register(User)
admin.site.register(Task)
admin.site.register(Tracking, BookAdmin)
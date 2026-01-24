from django.contrib import admin
from .models import Task, Tracking, User
#user: im_the_admin
#pass: 123456
# Register your models here.


class BookAdmin(admin.ModelAdmin):
    readonly_fields = ('id',)

admin.site.register(User)
admin.site.register(Task)
admin.site.register(Tracking, BookAdmin)
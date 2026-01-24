from django.db import models

#Added
from django.contrib.auth.models import AbstractUser
import datetime

# Create your models here.
class User(AbstractUser):
    pass

class Task(models.Model):
    CATEGORIES = [
        ('HYGI', 'Hygiene'),
        ('SELF', 'Self-Care'),
        ('GOAL', 'Goal-Progress'),
        ('MISC', 'Miscelaneous')
    ]
    
    task_name =  models.TextField(max_length = 30)
    owner_username = models.ForeignKey(User, on_delete=models.CASCADE, related_name="task_owner")

    category = models.CharField(
        max_length=4,
        choices=CATEGORIES,
        default='Miscelaneous'
    )

    def serialize(self, request):
        if Tracking.objects.filter(task=self.id, date=datetime.date.today()).exists():
            today_tick = Tracking.objects.get(task=self.id, date=datetime.date.today())
            tick = today_tick.tick
            note_text = today_tick.notes
        else:
            tick = False
            note_text = ""
        return{
            "id": self.id,
            "task_name": self.task_name,
            "owner": self.owner_username.username,
            "category": self.get_category_display(),
            "tick_state": tick,
            "note_text": note_text
        }

    def __str__(self):
        return f"{self.task_name} on the category {self.category} created for the user {self.owner_username.username}!"

class Tracking(models.Model):
    owner_username = models.ForeignKey(User, on_delete=models.CASCADE, related_name="track_owner")
    task = models.ForeignKey(Task,on_delete=models.CASCADE, related_name="name_of_task")
    date = models.DateField(auto_now_add=True)
    notes = models.TextField(max_length = 100, blank=True)
    tick = models.BooleanField(default=False)


    def serialize(self, request, mode):
        if mode == "detailed_date":
            return{
                "id": self.id,
                "owner": self.owner_username.username,
                "task": self.task.task_name,
                "day": self.date.day,
                "year": self.date.year,
                "month": self.date.month,
                "month_format": self.date.strftime("%b"),
                "week_format": self.date.strftime("%b %d"),
                "notes": self.notes,
                "tick": self.tick,
                "category": self.task.get_category_display()
            }
        else:
            return{
                "id": self.id,
                "owner": self.owner_username.username,
                "task": self.task.task_name,
                "date": self.date.strftime("%b %d %Y"),
                "notes": self.notes,
                "tick": self.tick,
                "category": self.task.get_category_display()
            }

    def __str__(self):
        #formatted_date = self.date.strftime("%b %d %Y, %I:%M %p")
        formatted_date = self.date
        return f"Tracking Entry made on {formatted_date} for the Task of {self.task.task_name}!"
    


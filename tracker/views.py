from django.shortcuts import render

from django.urls import reverse
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect
from django.http import JsonResponse
import json

from django import forms
from django.views.decorators.csrf import csrf_exempt
import datetime
from collections import defaultdict

from .models import User, Task, Tracking

# Forms

class NewTaskForm(forms.Form):
    task_name = forms.CharField(label='', widget=forms.TextInput(attrs={
        'id': 'task_name_form',
        'name': 'task_name',
        'class': 'form-small',
        'placeholder': 'What is your goal?'
    }))

    CATEGORIES = [
        ('HYGI', 'Hygiene'),
        ('SELF', 'Self-Care'),
        ('GOAL', 'Goal-Progress'),
        ('MISC', 'Miscelaneous')
    ]
    task_category = forms.ChoiceField(label = '', choices=CATEGORIES, initial='MISC', widget = forms.Select(attrs={
        'id': 'task_category_form',
        'name': 'task_category',
        'class': 'form-small misc-dropdown',
        'placeholder': 'Category'
    }))

# Create your views here.
    
@login_required
def index(request):
    if request.method == "GET":
            return render(request, "tracker/index.html")
    else:
        return JsonResponse({"error": "Invalid request."}, status=400)

@login_required
def create(request):
    if request.method == "GET":
        return render(request, "tracker/creation.html",{
            "task_form": NewTaskForm()
        })
    else:
        return JsonResponse({"error": "Invalid request."}, status=400)

@login_required
def customization(request):
    user_id = User.objects.get(id=request.user.id)
    #if method is GET, look for the existing values for the custom tasks
    if request.method == "GET":
        custom_tasks = Task.objects.filter(owner_username=user_id)
        if len(custom_tasks) > 0:
            return JsonResponse({
                'tasks': [task.serialize(request) for task in custom_tasks]
            }, safe=False)
        else:
            return JsonResponse({"error": False}, safe=False)

    #if the method is POST, add to the DB the changes the user made through the front end
    elif request.method == "POST":
        data= json.loads(request.body)
        action = data.get("action")
        if action == "Add":
            task = data.get("task_name")
            task= task.capitalize()
            category = data.get("task_category")
            print(category)
            current_user = User.objects.get(id=request.user.id)

            # Check if the task name is already on DB
            if not Task.objects.filter(task_name=task, owner_username=current_user).exists():
                try:
                    new_task = Task(
                        task_name = task,
                        owner_username = current_user,
                        category = category

                    )
                    new_task.save()
                    print(f"{task} task added!")
                    # Check for the addition showing on the DB, then sending that data to JS
                    if Task.objects.filter(task_name=task, owner_username=current_user).exists():
                        new_task_info = Task.objects.get(task_name=task, owner_username=current_user)
                        return JsonResponse({'recent_task': new_task_info.serialize(request)}, safe=False)
                    else:
                        return JsonResponse({"error": False}, safe=False)
                except Exception as e:
                    return JsonResponse({"error": e}, status=400)
            else:
               return JsonResponse({"error": "Task already exists on list."})
        else:
            return JsonResponse({"error": "Requested action is not available."})
        
    # the PUT method will be used for changes to preexisting custom tasks
    elif request.method == "PUT":
        data = json.loads(request.body)
        task_id = data.get('task_id')
        new_name = data.get('task_name')
        new_category = data.get ('task_category')

        try:
            task_entry = Task.objects.get(id=task_id)
            task_entry.task_name = new_name
            task_entry.category = new_category
            task_entry.save()
            edited_task = Task.objects.get(id=task_id)
            return JsonResponse(edited_task.serialize(request))
        except Exception as e:
            return JsonResponse({"error": e}, status=400)
    # the DELETE method is used for deleting entries to the db, naturally
    elif request.method == 'DELETE':
        data = json.loads(request.body)
        task_id = data.get("task_id")
        try:
            delete_task = Task.objects.filter(id=task_id)
            print(delete_task)
            delete_task.delete()
            message = "Task deleted succesfully!"
            return JsonResponse({"message": message})
        except Exception as e:
            return JsonResponse({"error": e}, status=400)
    else:
        return JsonResponse({"error": "Invalid Request."}, status=400)

@login_required
def manage_habit(request):
    user_id = User.objects.get(id=request.user.id)
    
    # GET REQUEST HANDLING
    if request.method == "GET":
        # Get the list of tasks that user has set up for the day
        task_list = Task.objects.filter(owner_username=user_id)
        # print(task_list)
        if len(task_list) > 0:
            return JsonResponse({
                'tasks': [task.serialize(request) for task in task_list]
            }, safe=False)
        else:
            return JsonResponse({"error": False}, safe=False)
    
    ##########################################################################

    # PUT REQUEST HANDLING FOR TICKING AND UNTICKING TASKS
    elif request.method == "PUT":
        data = json.loads(request.body)
        task_id = data.get('task_id')
        # Before making new entries or altering existing ones, we first check if a tracking of this task for today exists
        if Tracking.objects.filter(task=task_id, date=datetime.date.today()).exists():
            existing_tracking = Tracking.objects.get(task=task_id, date=datetime.date.today())
            print("\n\nPreexisting Task on DB!")
            print(existing_tracking)
            if existing_tracking.tick == True:
                # If the tracking is already ticked, untick
                # But if the tracking also has empty notes, delete the whole entry, as it would be essentially empty
                if existing_tracking.notes == "":
                    try:
                        existing_tracking.delete()
                        print("Track doesn't count with a tick nor notes, tracking deleted...")
                        return JsonResponse({"current_tick": False}, safe=False)
                    except Exception as e:
                        return JsonResponse({"error": e}, status=400)
                else:
                    try:
                        print("Task tick removed...")
                        existing_tracking.tick = False
                        existing_tracking.save()
                        return JsonResponse({"current_tick": False}, safe=False)
                    except Exception as e:
                        return JsonResponse({"error": e}, status=400)
            elif existing_tracking.tick == False:
                # If the tracking is currently unticked, tick it
                # Tick tracking
                try:
                    existing_tracking.tick = True
                    existing_tracking.save()
                    print("Task completed and ticked!")
                    return JsonResponse({"current_tick": True}, safe=False)
                except Exception as e:
                    return JsonResponse({"error": e}, status=400)
            else:
                return JsonResponse({"error": 'Something went wrong, please refresh the page and try again.'}, status=400)
        # if the Tracking for this task and for today doesn't exist, create one, and apply the tick
        else:
            # first, obtain the task that the Tracking is referring to, to define the foreign key on the new entry
            print("\n\nNo preexisting tracking for task... Creating Tracking!")
            tracked_task = Task.objects.get(id=task_id)
            try:
                new_tracking = Tracking(
                    owner_username = user_id,
                    task = tracked_task,
                    tick = True
                )
                new_tracking.save()
                print(f"{tracked_task.task_name} task has been checked for today!")
                return JsonResponse({"current_tick": True}, safe=False)
            except Exception as e:
                return JsonResponse({"error": e}, status=400)
            
    ###################################################################################
    
    # POST REQUEST HANDLING FOR NOTES
    elif request.method == "POST":
        # first, checif the entry already exists
        data = json.loads(request.body)
        task_id = data.get('task_id')
        notes_text = data.get('notes')
        tracked_task = Task.objects.get(id=task_id)
        if Tracking.objects.filter(task=task_id, date=datetime.date.today()).exists():
            # If the tracking for today DOES exist, simply get it, and change the notes
            print("\n\nTracking already exists... Updating tracking...")
            existing_tracking = Tracking.objects.get(task=task_id, date=datetime.date.today())
            if(existing_tracking.notes == notes_text):
                print("\n\nNo changes in Notes detected...")
                return JsonResponse({"same": False}, safe=False)
            else:
                print("\n\nNew notes confirmed, updating...")
                try:
                    existing_tracking.notes = notes_text
                    existing_tracking.save()
                    updated_tracking = Tracking.objects.get(id=existing_tracking.id, owner_username= user_id)
                    return JsonResponse(updated_tracking.serialize(request, ""), safe=False)
                except Exception as e:
                    return JsonResponse({"error": e}, status=400)
        else:
            # If the tracking for today doesn't exist, create a new tracking with the notes and no tick
            try: 
                print("\n\nUpdating Notes... Creating today's tracking...")
                new_tracking = Tracking(
                    owner_username = user_id,
                    task = tracked_task,
                    notes = notes_text,
                    tick = False
                )
                new_tracking.save()
                print("\n\nNotes updated! Today's tracking created!")
                updated_tracking = Tracking.objects.get(id=new_tracking.id, owner_username= user_id)
                return JsonResponse(updated_tracking.serialize(request, ""), safe=False)
            except Exception as e:
                return JsonResponse({"error": e}, status=400)
    else:
        return JsonResponse({"error": "Invalid Request."}, status=400)

@login_required
def history(request):
    if request.method == "POST":
        data = json.loads(request.body)
        selected_date = data.get('selected_date')
        current_user = User.objects.get(id=request.user.id)
        if Tracking.objects.filter(owner_username=current_user, date=selected_date).exists():
            tracking_list = Tracking.objects.filter(owner_username=current_user, date = selected_date)
            if len(tracking_list) > 0:
                return JsonResponse({
                    'tracked_tasks': [task.serialize(request, "") for task in tracking_list]
                }, safe=False)
            else:
                return JsonResponse({"error": False}, safe=False)
        else:
            return JsonResponse({"error": 'No entries for the selected date'}, safe=False)
    elif request.method == "GET":
        return render(request, "tracker/history.html")
    else:
        return JsonResponse({"error": "Invalid Request."}, status=400)

@login_required
def summary(request):
    if request.method == "POST":
        current_user = User.objects.get(id=request.user.id)

        data = json.loads(request.body)
        year = data.get("year")
        month = data.get("month")
        day = data.get("day")
        mode = data.get("mode")
        category = data.get("category")

        total_tasks_day = Task.objects.filter(owner_username=current_user).count()

        start_month = month
        start_year = year
        
        roll_month = month - 1

        if roll_month < 1:
            roll_month = 12 - abs(roll_month)
        # Handling of the data and calculations on a week
        if mode == "week":
            start_day = day - 6
            
            if start_day < 1:
                start_month = month - 1
                if (start_month < 1):
                    start_month = 12 - abs(start_month)
                    start_year = year - 1
                roll_date = daysInMonth(start_month, start_year)
                start_day = roll_date - abs(start_day)
            start_date = datetime.date(start_year, start_month, start_day)
            end_date = datetime.date(year, month, day)

            fulfillment = {}
            for i in range(6, -1, -1):
                day_fill = day - i
                month_fill = month
                year_fill = year
                if day_fill < 1:
                    month_fill = month - 1
                    if month_fill < 1:
                        month_fill = 12 - abs(month_fill)
                        year_fill = year - 1
                    day_fill = daysInMonth(month_fill, year_fill) - abs(day_fill)
                date_fill = datetime.date(year_fill, month_fill, day_fill).strftime("%b %d")
                fulfillment.update({date_fill: 0})
            if category == 'OVERALL':
                date_query = Tracking.objects.filter(owner_username=current_user,date__range=[start_date, end_date])
            else:
                date_query = Tracking.objects.filter(owner_username=current_user, task__category = category,date__range=[start_date, end_date])
                total_tasks_day = Task.objects.filter(owner_username=current_user, category = category).count()
            if len(date_query) > 0:
                raw = {'tracked_tasks': [task.serialize(request, "detailed_date") for task in date_query]}
                by_date = defaultdict(list)

                for entry in raw["tracked_tasks"]:
                    if entry["tick"] == True:
                        by_date[entry["week_format"]].append(entry)

                count = 0
                success = 0
                for date in by_date:
                    count = len(by_date[date])
                    success = count / total_tasks_day
                    fulfillment[date] = success

            return JsonResponse(fulfillment, safe=False)
        
        ###################################################
        # Handling of the data and calculations on 4 months
        elif mode == "month":
            start_day = 1
            start_month = month - 3
            if (start_month < 1):
                start_month = 12 - abs(start_month)
                start_year = year - 1
            start_date = datetime.date(start_year, start_month, start_day)
            day = daysInMonth(month, year)
            end_date = datetime.date(year, month, day)

            fulfillment = {}
            for i in range(3, -1, -1):
                fill_month = month - i
                fill_year = year
                if (fill_month < 1):
                    fill_month = 12 - abs(fill_month)
                    fill_year = year - 1
                date_fill = datetime.date(fill_year, fill_month, 1).strftime('%b')
                fulfillment.update({date_fill:0})

            if category == 'OVERALL':
                date_query = Tracking.objects.filter(owner_username=current_user,date__range=[start_date, end_date])
            else:
                date_query = Tracking.objects.filter(owner_username=current_user, task__category = category,date__range=[start_date, end_date])
                total_tasks_day = Task.objects.filter(owner_username=current_user, category = category).count()
            if len(date_query) > 0:
                raw = {'tracked_tasks': [task.serialize(request, "detailed_date") for task in date_query]}
                by_month = defaultdict(list)
                
                for entry in raw["tracked_tasks"]:
                    if entry["tick"] == True:
                        by_month[entry["month"]].append(entry)
                    
                    count = 0
                    success = 0
                    first_month = next(iter(by_month))
                    for month_tracking in by_month:
                        count = len(by_month[month_tracking])
                        if (first_month < month_tracking):
                            year_on_month = year
                        else:
                            year_on_month = year - 1
                        total_tasks_month = total_tasks_day * daysInMonth(month_tracking, year_on_month)
                        success = count / total_tasks_month
                        month_format = next(iter(by_month[month_tracking]))["month_format"]
                        fulfillment[month_format] = success

            return JsonResponse(fulfillment, safe=False)
        else:
            return JsonResponse({"error": "Invalid request."}, status=400)
        
    elif request.method == "GET":
        return render(request, "tracker/summary.html")
    else:
        return JsonResponse({"error": "Invalid request."}, status=400)

def login_view(request):
    if request.method == "POST":
        #Attempt to get login info from page and signing in

        username = request.POST["username"]
        password = request.POST["password"]

        user = authenticate(request, username=username, password=password)

        # Check for succesful authentication
        if user is None:
            return render(request, "tracker/login.html",{
            'message': "Invalid username or password!"
            })
        else:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))

    else:
        return render(request, "tracker/login.html")

def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))

def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Check so Password and Confirmation match
        password = request.POST["password"]
        confirmation = request.POST["confirmation"] 

        if password != confirmation:
            return render(request, "tracker/register.html",{
                "message": "Password doesn't match confirmation."
            })
        if len(password) == 0:
            return render(request, "tracker/register.html",{
                "message": "An account requires a password."
            })
        
        # Create a new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except Exception as e:
            return render(request, "tracker/register.html", {
                "message": e
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "tracker/register.html")
    


######################
# NON VIEW FUNCTIONS #
######################

# function takes a month and year, and calculates the maximum days it has (including leaps)
def daysInMonth(month, year):
    months_31 = [1, 3, 5, 7, 8, 10, 12]
    months_30 = [4, 6, 9, 11]
    if month in months_31:
        days = 31
    elif month in months_30:
        days = 30
    elif month == 2:
        # calculate for leap years
        if year % 4 == 0:
            if year % 100 != 0:
                days = 29
            elif year % 400 == 0:
                    days = 29
            else:
                days = 28
        else:
            days = 28
    return days
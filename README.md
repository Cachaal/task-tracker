# Task Tracker

## Introduction
Task tracker is a web tool that allows users to create a custom-made list of habits they wish to fulfill consistently. The tool will allow users to check in on their daily habits, as well as leaving comments on it on a daily basis per habit; keeping track of their history by the day; and providing graphic summaries of their progress on said habits in contrast of previous days or months so it's easier to track the deficits on their consistency.
A combination of Django, JavaScript, HTML, CSS, Bootstrap, Chart.js and Tempus Dominus where used in tandem in order to make this project possible.

## How to Run
There's no additional factors in comparison to the rest of CS50Web's projects regarding how to run the project, as long as you're on the main folder of the project, using the command:

> python manage.py runserver

Is enough the get the project running, since no additional packages are used.
## Project Breakdown
### models. py:
On this file, as expected, the designed database structure was defined based on the following diagram:

     _________________________________
    | TRACKING                        |
    ----------------------------------
    | ID             |  Integer  | PK |
    | owner_username | Charfield | FK | >>======|
    | task           | Textfield | FK | >>==|   |
    | date           | Datefield |    |     |   |
    | notes          | Textfield |    |     |   |
    | tick           | Boolean   |    |     |   |
     ----------------------------------     |   |
                                            |   |
      _________________________________     |   |
     | TASK                            |    |   |
     ----------------------------------     |   |
     | ID             | Integer   | PK | <<=|   |
     | task_name      | Textfield |    |        |
     | category       | Charfield |    |        |
     | owner_username | Charfield | FK | >>=====|
     -----------------------------------        |
                                                |
     __________________________________         |
     | USER (Default Django User)      |        |
     ----------------------------------         |
     | ID       |     Integer     | PK | <<=====|
     | username |    Charfield    |    |
     | email    |    Charfield    |    |
     | password |    Hashtext     |    |
     ----------------------------------
     (only relevant user fields mentioned)
Serializing functions are also included in the Task and Tracking models for a peaceful communication between front and back-end.

###  views .py:
The backbone of the project, managing the page to page loading, as well as handling the information given by the user and the model. As expected, since this single file runs the whole project's back-end when it comes to handling, it's pretty big. These are the main functions on it:
- **def  index(request):** This one's simple. When on the path "/", it handles a GET request, and loads index.html. If a request different from GET is submitted, it results in an error.
- **def  manage_habit(request):** This function is called by the index.js file, which is in itself used by the index.html file.
  - On a **GET** request, it will retrieve from the database all of the daily tasks for the day, including information on whether the task has been completed already today, and a comment for a specific task on every task (if available). Then, it will either return a serialized array with the information of the query, or an error message if something goes wrong with the query.
  - On a **PUT** request, it will handle the logic behind checking and unchecking a task. It first checks whether the requested task has already an entry for today (in order to avoid duplicate entries), if a tracking entry for today already exists, it will then check whether the task was already been checked for today, if it has, it will uncheck the task, and if the task will end up empty when unchecked (mostly if it also doesn't have a comment), it will delete the entry for that day as well.
 If a task has not been checked for the day, it will check it, and in the case that an entry doesn't exist yet, it will create the entry, then check it.
 For each scenario, it will return a message or the boolean value of the Checkmark, so the front-end can properly display the check.
  -On a **POST** request, it will handle the logic regarding adding notes to a daily task. If an entry for today on that task already exists, it will simply add to that entry the comment or update the preexisting comment with the new information (it will also check if the submitted notes are the same as the preexisting notes. If not, it will simply create an entry, then add the comment.
 On each scenario, it will return either a message confirming the success or failure of the operation, or a serialized array with the new information on the entry.
  
- **def  create(request):** Pretty much the same as the function above. The only distinction is that, when on the path "/add-tasks" it loads create.html and delivers a form for adding a new task to the daily tasks on index.html.
- **def  customization(request):** This function is called by the create.js file, which is in itself used by the create.html file.
  - On a **GET** request, it will obtain all of the user's daily task that have already been created, if any. This with the purpose of allowing the user to either delete a no longer useful task from their daily tasks, as well as allowing the user to **edit the contents** of a preexisting daily task.
  - On a **POST** request, it will **create or add** a new task, it will simply read the values on the form inputted by the user, add a new entry on the database with the new information, and return to the create.js file th+
0  - /oie new entry added serialized, or in the case of an error or a repeat, it will return an error.
  - On a **PUT** request, it will **edit** the contents of a preexisting task on the list based on the information relayed from create.js. Once it receives the information, it will make the changes on the database, then it will return the newly edited task entry serialized.
  - On a **DELETE** request, it will, naturally, delete the entry requested by the user from the database and return a confirmation message.
 - **def  history(request):** When on the path "/history", it will handle the requests from history.js to deliver historical information on the daily tasks of an user, or load history.html.
   - On a **GET** request, it will, as stated, load the create.html file. 
   - On a **POST** request, it will receive the data containing the date the user wishes to lookup, will query on the database all task entries that exist for that specific days, and either deliver those entries (serialized), or return an error message (for example, if no information was found on a given date).
 - **def  summary(request):** When on the path "/summary", it will handle a user request for statistical values on a range of dates, or load summary.html.
   - On a **GET** request, it will load summary.html as previously stated.
   - On a **POST** request, it will first receive the information of the request, including year, month and day specified, the category of the tasks that need statistics, and the "mode", which is simply whether the user wants weekly statistics, or monthly statistics.
 On **monthly** statistics, it will first calculate, based on the initial date received, 4 months in the past (accounting of rolling back to December if it goes beyond January), query from the database all daily tasks filled on that range of dates that match the category requested (or from all categories if it was requested "OVERALL").
Then, for every month, it will obtain a success rate, based on the total possible tasks that can be fulfilled on each month, compared of all of the tasks actually fulfilled on that month, and return a dictionary matching a month with its respective success rate.
On **weekly** statistics, it will do mostly the same, with the exception that it will calculate the range of days only a week past the requested date, considering of course possible rollback of the day of the month if said past week goes over a different month and even year. It will also consider leap years on this calculation.
It will return a dictionary matching each day with its respective success rate.
- **def  login_view(request):** When on the path "/login", It simply allows the user to log into their account by taking the username and password from a form, validating it and either let the user in or not. Or in the case that the page is just loading in, it will load login.html.
- **def  logout_view(request):** When the user clicks the logout button, it will log out the user, and send it back to the login page.
- **def  register(request):** When on the path "/register", it will either allow for the user to create a new account based on the form containing a username box, a password box, and a password confirmation box; or load register.html when first entering.

### layout.html:
Contains the bare base of the structure of the page that are inherited to every other html file like the navigation bar and the dropdown version of the  navigation bar that shows up at small screen sizes.
It also includes the links to the libraries like Tempus Dominus and Bootstrap.

### login.html and register.html:
Really simple page that shows the necessary forms for the user to either log in with a preexisting account or register a new account.
### index.js and index.html:
The html and JS file work together in order to display and communicate with the back-end to rely their daily tasks to the user.
The html file is mostly empty, including only the link to index.js, the Bootstrap Toast html and an empty div for the content to be appended to on the JS file.

Index.js will, on load, make use of a fetch request to the back-end. Once it receives the user's daily tasks, it will display them on a table made based on the Bootstrap column system. The constructed and appended information is shown, per row, in the following way:
- A checkmark to allow users to "complete" their task for the day. On change, it will prompt the front-end to communicate with the backend to update the status of the task. Once received confirmation from the back-end, the front-end will show a Bootstrap toast to the user relying the notification.
- The task name that was inputted by the user on the Customization page (creation.js and html).
- The category of the task, applied by the user on the Customization page.
- A textarea box that is prefilled with the notes the user has filled for the day (if any) whenever it looses focus (intended to be whenever the user clicks away after typing), the front-end will communicate with the back-end in order to either update, notify of no changes, or the creation of new notes for the task of the day. Whenever notes are successfully submitted, the front-end will notify the user through a Bootstrap Toast.
### history.js and history.html:
Arguably the simplest of the main pages, since it's the least interactive.
The history.html file is, like most of the html files on the project, mainly empty, with the exception of the required html  and initialization script for a **Tempus Dominus** container, the required html for a Bootstrap Toast, a mobile-friendly calendar that shows up at small screen sizes and naturally, an empty div for content to be appended to.

The history,js file will first apply Event Listeners to both of the calendars, mobile-friendly and **Tempus Dominus** (only one is shown up at a given time).
Once a date is selected, the file will communicate to the back-end through a fetch request, and once the back-end relies the historic information on the day selected, the front-end will create the html adding the information to a table using Bootstrap's column system, append it to history.html and notify the user through a Bootstrap Toast.

### creation.js and creation.html:
Once again, the creation.html file is mostly empty by default, with the exception of the required html for a Bootstrap Toast, a pre-made form for submission of new daily tasks, and a div for content to be appended to.

The creation.js file will, on load, make a fetch request to the backend in 
order to get all previously set up tasks. Once they're received, it will structure the information on a table based on the Bootstrap's column system. The constructed and appended information, per row, is the following:
- Task name: Simple enough, the simple text is replaced with a text input box when on "edit mode".
- Task category: Once again, simple text that is replaced with a dropdown box when on "edit mode"
- Delete and Edit buttons: Mobile-responsive buttons that allow, as the name implies, to delete a specific daily task (requires a second click for confirmation) and enter "edit mode", allowing to change the contents of a preexisting daily task. Both buttons are replaced with a Save button when on "edit mode".

Whenever a change is saved on edit mode, a task is deleted or added, once the back-end processes said changes, the front-end will notify the user through a Bootstrap Toast.

### summary.js and summary.html:
Personally, the most fun page to develop, mostly for the use of **Chart.js**.
Different from the other html files on this project, summary.html actually contains most of the contents of the page, including the required html and initialization for Tempus Dominus, a mobile-responsive calendar for small screen sizes, and 2 dropdown boxes to define the calendar mode and the category wishes to be displayed.

The summary.js file mostly takes care of handling Chart.js, Tempus Dominus and properly parsing information in order for the background to properly process it into statistics.
Based on the state of the calendar mode dropdown, it will change Tempus Dominus into "week mode", where it simply shows individual days for selection, or "month mode" which will show a month selection; this dropdown is also referenced when communicating to the back-end alongside the category dropdown in order to get either monthly or weekly statistics.
Whenever either a category is selected (overall by default) or a date / month is selected, summary.js will parse the date provided by the calendars, separating said date into its components, and in the case of a monthly selection, assume the maximum number of days in said month.
Once the information is ready to be sent, the front-end will communicate with the back-end through a fetch request, relying the date information, as well as the dropdown information to receive the proper statistics.
As soon as the back-end returns a dictionary linking months / days to their success rate, summary.js will summon a Chart.js instance, which will display a line graph with the proper success rate.
Whenever the category or selected date / month change, Chart.js will update to the new information, without requiring a chart to be summoned again.

### styles.css:
Maybe not the best idea in hindsight, but this file handles the styling of the whole project that isn't already handled by Bootstrap, from the background to the individual element's aesthetics.
It also contains the animations for adding / deleting entries onto a table.
I decided to select the color palette to, first of all, be night-time friendly, as I myself am a Night Owl. Deciding on the color green for the main color theming was only a matter of trial and error.
The background pattern was made through an online css pattern generator tool called css-pattern (linked below).


## Difficulties and Reflections
### Filling the database:
Imagine my horror when, once the project was finished, I realized in order to be shown as a proof of concept, I needed to actually fill several months worth of daily tasks.
Once I found my stride, it wasn't actually that bad using the Django Admin page, but it did require more time than I had hoped.
In the future, I need to research ways to fill on mass a Django Model.
### Tempus Dominus:
Because of my engineering background, I'm no stranger to documentation (although to be fair, not necessarily library documentation), I strongly believe relying on documentation is vital in order for things to run smoothly and, most importantly, flexibly. Understanding how to navigate the documentation allows for much better troubleshooting and problem solving.
However, I found the Tempus Dominus documentation to be excessively obtuse, it complicated much of the styling and the structuring of the calendar alongside the rest of the page's elements. From refusing to move due the html structure required, to not be able to change colors, to refusing to "change modes"; Tempus Dominus proved the biggest head-ache in the project, which is surprising considering it's not that crucial to the project itself.
I ought to find a better library for an aesthetically pleasing calendar next time.
### Mobile Responsiveness:
I'll be honest, this one is my fault, I didn't properly plan how I wanted to structure the project's pages, everything was pretty much laid down properly on my planning text file, this of course came to bite me as soon as the logic of the project was finished.
I didn't account for mobile responsiveness, all tables broke, the navigation bar overflowed, the calendars misaligned, and even data didn't fit in small screens.

After completely restructuring the project through Bootstrap's column system, alternative elements for the navigation bar and calendars on mobile, and Bootstrap Toasts, mobile responsiveness was achieved (at least to my standards).
In the future, I will consider mobile responsiveness from the get go, it really comes down on you hard if not.


## Additional Resources
> Tempus Dominus documentation: https://getdatepicker.com/6/

> Chart.js documentation: https://www.chartjs.org/docs/latest/

>Bootstrap documentation:  https://getbootstrap.com/docs/5.3/getting-started/introduction/

> Online Markdown editor: https://stackedit.io/app

> CSS guidance: https://www.w3schools.com/css/

> Background pattern generator: https://css-pattern.com/waves/

> General Support: https://stackoverflow.com/questions

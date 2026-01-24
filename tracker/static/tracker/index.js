addEventListener('DOMContentLoaded', () => {
    console.log("Reached the Index page");
    console.log("Loading daily tasks...");

    load_daily_habits();
})

function load_daily_habits(){
    fetch(`/manage-habit`)
    .then(response => response.json())
    .then(result => {
        console.log(result)
        if (result.error != undefined){
            // The backend only delivers a 'false' on error when the query is succesful, but there's no entries on DB
            console.log("No results");
            if (result.error == false){
                document.querySelector('#message').innerHTML = `<h2>Welcome!</h2>
                                                                <h4>Looks like you haven't set up your habits yet! To start, click the Customization tab to get things set up.</h4>`;

                if (document.querySelector('#content').innerHTML == ""){
                    const table_heads = document.createElement('div');
                    table_heads.className = 'task-box row';
                    table_heads.innerHTML = `<div class='tick-cell col-1 d-flex justify-content-center fw-bold'>  </div>
                                            <div class="col-3 d-flex justify-content-center fw-bold"> TASK </div>
                                            <div class="col-3 d-flex justify-content-center fw-bold"> CATEGORY </div>
                                            <div class="col-5 d-flex justify-content-center fw-bold"> NOTES </div>`;
                    document.querySelector('#content').append(table_heads);
                }
            }
            else {
                console.log(result.error);
                document.querySelector('#error-message').innerHTML = result.error;
            }
        }
        else {
            // Use the task data sent by backend to structure it on a table
            const table_heads = document.createElement('div');
            table_heads.className = 'task-box row';
            table_heads.innerHTML = `<div class='tick-cell col-1 d-flex justify-content-center fw-bold'>  </div>
                                    <div class="col-3 d-flex justify-content-center fw-bold"> TASK </div>
                                    <div class="col-3 d-flex justify-content-center fw-bold"> CATEGORY </div>
                                    <div class="col-5 d-flex justify-content-center fw-bold"> NOTES </div>`;
            document.querySelector('#content').append(table_heads);

            result.tasks.forEach(task => list_tasks(task));
        }
    })
}


function list_tasks(content){
   console.log("Loading today's user tasks");
   console.log(content);
   const task = document.createElement('div');
   task.className = 'task-box row align-items-center';


   // Daily tick creation and handling
   const tick_cell = document.createElement('div');
   tick_cell.className = 'tick-cell col-1 d-flex justify-content-center';
   const tick = document.createElement('input');
   tick.className = "tick";
   tick.type = 'checkbox';
   tick.checked = content.tick_state;

   tick_cell.append(tick);


   // Static information handling
    const task_name = document.createElement('div');
    task_name.className = "col-3 d-flex justify-content-center";
    task_name.innerHTML = content.task_name;

    const task_category = document.createElement('div');
    task_category.className = "col-3 d-flex justify-content-center";
    task_category.innerHTML = content.category;


    // Notes section handling
    const notes_cell = document.createElement('div');
    notes_cell.className = 'notes-cell col-5 d-flex justify-content-center';
    const notes = document.createElement('textarea');
    notes.maxLength = "40";
    notes.className = 'notes';
    notes.placeholder = 'Any comments?'
    
    /* notes button scrapped
    const notes_button = document.createElement('button');
    notes_button.className = 'notes-button btn';
    notes_button.innerHTML = ' Save ';
    */

    if (content.note_text != ""){
        notes.value = content.note_text;
    }

    /* not needed once the save button has been scrapped
    notes_button.addEventListener('click', () => {
        submit_notes(notes, content);
    });
    */
    notes.addEventListener("focusout", () =>{
        submit_notes(notes, content);
    });


    //notes_cell.append(notes, notes_button);
    notes_cell.append(notes);

    // Add everything to the row, then add the row to the main table
    task.append(tick_cell, task_name, task_category, notes_cell);

    // Handling of a tick (or completing a task)
    tick.addEventListener('click', () => {
        update_tick(content, tick, task);
    })

    document.querySelector('#content').append(task);
    task.style.animation = 'delete-create 0.6s reverse';
}

function update_tick(content, tick, task){
    // Function will request an update to the tick on backend DB
    // Then, it will check wether the tick ends up checked or unchecked, and update the tick to make sure is reflected properly
    fetch(`manage-habit`, {
        method: 'PUT',
        headers:{
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
        },
        body: JSON.stringify({
            task_id: content.id
        })
    })
    .then(response => response.json())
    .then(result => {
        const toast = document.getElementById("toast");
        const toast_content = document.getElementById("toast-content");
        const trigger = new bootstrap.Toast(toast);
        if(result.error != undefined && result.error.length >0){
            toast_content.innerHTML = result.error;
            trigger.show();
        }
        else if (result.current_tick == true){
            // If task on backend is ticked, assure is ticked on frontend
            console.log("Task completed and ticked!");
            tick.checked = true;
            toast_content.innerHTML = "Task completed and ticked!";
            trigger.show();

        }
        else if (result.current_tick == false){
            // If task on backend is unticked, assure is unticked on frontend
            console.log("Task unticked...");
            tick.checked = false;
            toast_content.innerHTML = "Task unticked...";
            trigger.show();
        }
        else{
            console.log(result);
        }    
    })
}


function submit_notes(notes, content){
    notes_text = notes.value;
    fetch(`manage-habit`, {
        method: 'POST',
        headers:{
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
        },
        body: JSON.stringify({
            task_id: content.id,
            notes: notes_text
        })
    })
    .then(response => response.json())
    .then(result => {
        const toast = document.getElementById("toast");
        const toast_content = document.getElementById("toast-content");
        const trigger = new bootstrap.Toast(toast);
        if(result.error != undefined && result.error.length >0){
            toast_content.innerHTML = result.error;
            trigger.show();
        } else if (result.same == false){
            console.log("No changes made to notes (Server Side).");
            toast_content.innerHTML = "No changes made to notes."; 
            trigger.show();
        } else 
        {
            console.log("Note Submitted!");
            console.log(result);
            notes.value = result.notes;


            toast_content.innerHTML = `Notes for ${result.task} submitted!`;

            
            trigger.show();

            //document.querySelector('#message').innerHTML = `Notes Updated: ${result.notes}`;
        }

        
    })
}
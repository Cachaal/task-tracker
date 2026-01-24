document.addEventListener('DOMContentLoaded', () => {

    load_habits();

    document.addEventListener('submit', function(e) {
        // Line to prevent Django from reloading the page when submitting form
        e.preventDefault();

        // Gather the information from the form
        form_info = document.querySelector('#task-form');
        const task_data = new FormData(form_info);


        // Line for Debugging
        console.log(task_data.get('task_category'));

        new_task(task_data);
    })

})


function load_habits(){
    console.log("Obtaining User's custom tasks");
    fetch(`/customization`)
    .then(response => response.json())
    .then(result =>{
        // Print results to console
        console.log(result)
        if (result.error != undefined){
            if (result.error == false){
                document.querySelector('#message').innerHTML = "<h4>Looks like you don't have any Tasks setup!</h1><h5>Let's set everything up!</h4>";
                if(document.querySelector('#content').innerHTML == ""){
                                const table_heads = document.createElement('div');
                                table_heads.className = 'task-box row';
                                table_heads.innerHTML = `<div class="col-4 d-flex justify-content-center fw-bold"> TASK </div>
                                                        <div class="col-4 d-flex justify-content-center fw-bold"> CATEGORY </div>
                                                        <div class="col-4"> </div>`;
                                document.querySelector("#content").append(table_heads);
                }
            }
            else if (result.error.length > 0){
                console.log(result.error);
                document.querySelector('#error-message').innerHTML = result.error;
            }
        }
        else {
            //send the data to the function that will display the data to user
            const table_heads = document.createElement('div');
            table_heads.className = 'task-box row';
            table_heads.innerHTML = `<div class="col-4 d-flex justify-content-center fw-bold"> TASK </div>
                                    <div class="col-4 d-flex justify-content-center fw-bold"> CATEGORY </div>
                                    <div class="col-4"> </div>`;
            document.querySelector("#content").append(table_heads);
            
            result.tasks.forEach(task => list_tasks(task));
        }
    })
}


function list_tasks(content){
    console.log("Loading user tasks...");

    task = create_task(content);
    
    // Add all of the prepared content to the main div on the page
    document.querySelector("#content").append(task);
    task.style.animation = 'delete-create 0.6s reverse';

}

function create_task(content){
    const task = document.createElement('div');
    task.className = 'task-box row align-items-center';
    task.innerHTML = `<div class="col-4 d-flex justify-content-center"> ${content.task_name} </div>
                    <div class="col-4 d-flex justify-content-center"> ${content.category} </div>`;

    // Html element specifically for storing all buttons for a task
    const button_space = document.createElement('div');
    button_space.className = 'task-buttons col-4 d-flex justify-content-center flex-wrap';

    // EDIT BUTTON CREATION AND HANDLING
    const edit = document.createElement('button');
    edit.className = 'edit-button btn';
    edit.innerHTML = 'Edit';

    button_space.appendChild(edit);

    edit.addEventListener('click', () =>{
        edit_task(task, content)
    });

    // function that will return a button element, and allow it to handle the deletion of a task
    const button_delete = delete_button(task, content);
    button_space.appendChild(button_delete);

    task.append(button_space);

    // Return the prepared HTML elements
    return task;
}

function delete_button(task, content){
    const button_delete = document.createElement('button');
    button_delete.className = 'delete-button btn';
    button_delete.innerHTML = 'Delete';

    button_delete.addEventListener('click', () => {
        // Button needs a second click to actually delete the task, the first click asks for confirmation
        if (button_delete.innerHTML == 'Confirm Deletion'){
            delete_task(task, content);
        }
        else{
            button_delete.innerHTML = 'Confirm Deletion';
        }

    });

    return button_delete;
}


function new_task(task_data){
    task_name = task_data.get('task_name');
    task_category = task_data.get('task_category');

    fetch(`/customization`, {
        method: 'POST',
        headers:{
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
        },
        body: JSON.stringify({
            task_name: task_name,
            task_category: task_category,
            action: 'Add'
        })
    })
    .then(response => response.json())
    .then(result => {
        // Print results
        console.log(result);

        const toast = document.getElementById("toast");
        const toast_content = document.getElementById("toast-content");
        const trigger = new bootstrap.Toast(toast);

        // Check for errors
        if(result.error != undefined && result.error.length >0){
            toast_content.innerHTML = result.error;
            trigger.show();
        }
        else{
            console.log('New task has been succesfully added!');
            toast_content.innerHTML = 'New task has been succesfully added!';
            trigger.show();
            console.log(result)

            // list the newly added task to the rest of preexisting tasks
            recent_task = result.recent_task;
            list_tasks(recent_task);
            // erase what was written on the form, so it can be reutilized
            document.querySelector('#task-form').reset();
        }
    })
}



function edit_task(task, content){

    console.log('Editing task...');
    console.log(content);

    // Create a new div so we can populate it with fields and then replace the current task element
    const edit_space = document.createElement('div');
    edit_space.className = 'task-box row align-items-center';
    // Create the fields
    const name_container = document.createElement('div');
    name_container.className = "col-4 d-flex justify-content-center";
    const edit_name = document.createElement('input');
    edit_name.type = 'text';
    edit_name.className = 'edit-name w-100';
    edit_name.value = content.task_name;
    name_container.appendChild(edit_name);

    const category_container = document.createElement('div');
    category_container.className = "col-4 d-flex justify-content-center";
    const edit_category = document.createElement('select');
    edit_category.className = 'edit-category';
    category_container.appendChild(edit_category);

    const save_container = document.createElement('div');
    save_container.className = "col-4 d-flex justify-content-center";
    const edit_save = document.createElement('button');
    edit_save.className = 'edit-save btn';
    edit_save.innerHTML = 'Save';
    save_container.appendChild(edit_save);

    
    // Extract the choices from preexisting form
    const existing_select = document.querySelector('#task_category_form');
    const choices = Array.from(existing_select.options);

    // Create a copy of each option, then append to new select in new form
    // Also, if the option matches the one of the preexisting data, preselect option
    choices.forEach(option => {
        const select_option = document.createElement('option');
        select_option.value = option.value;
        select_option.innerHTML = option.text;
        if (option.text == content.category){
            select_option.selected = true;
        }

        edit_category.appendChild(select_option);
    })

    

    // replace contents of that task with the editable fields
    edit_space.appendChild(name_container);
    edit_space.appendChild(category_container);
    edit_space.appendChild(save_container);

    task.replaceWith(edit_space);

    // Save button handling and functionality
    edit_save.addEventListener('click', () =>{
        new_name = edit_name.value;
        new_category = edit_category.value;
        fetch("/customization", {
            method: 'PUT',
            headers: {
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
            },
            body: JSON.stringify({
                task_id: content.id,
                task_name: new_name,
                task_category: new_category
            })
        })
        .then(response => response.json())
        .then(result => {
            const toast = document.getElementById("toast");
            const toast_content = document.getElementById("toast-content");
            const trigger = new bootstrap.Toast(toast);
            if (result.error != undefined && result.error.length > 0){
                console.log(result.error);
                toast_content.innerHTML = result.error;
                trigger.show();
            }
            else{
                console.log("Changes made succesfully!");
                toast_content.innerHTML = "Changes made succesfully!";
                trigger.show();
                console.log(result);

                // Recreate task on HTML with the new information
                edited_entry = create_task(result);

                edit_space.replaceWith(edited_entry);
              }
        })
    })
    
}

function delete_task(task, content){
    fetch(`/customization`,{
        method: 'DELETE',
        headers: {
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

        if (result.error != undefined && result.error.length > 0){
            console.log(result.error);
            toast_content.innerHTML = result.error;
            trigger.show();
        }
        else{
            console.log("Deleting task...");
            console.log(result);
            task.style.animation ='none';
            task.offsetHeight;
            task.style.animation = "delete-create 0.8s forwards";
            task.addEventListener('animationend', () =>{
                console.log("animation ended");
                toast_content.innerHTML = "Task deleted!";
                trigger.show();
                task.remove();
            })
            
        }
    });

}
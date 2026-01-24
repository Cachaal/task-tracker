addEventListener('DOMContentLoaded', () => {
    console.log("Reached the History Page!");
    const today = document.getElementById('date-input').value;
    console.log(`Today: ${document.getElementById('date-input').value}`);

    load_date_habits(today);

    const calendar = document.getElementById('datetimepicker2');
    const mobile_picker = document.getElementById('mobile-calendar');

    calendar.addEventListener('change.td', () => {
        const selectedDate = document.getElementById('date-input').value;
        console.log(`Selected date: ${selectedDate}`);
        load_date_habits(selectedDate);
    })

    mobile_picker.addEventListener('change', (e) => {
        const selectedDate = e.target.value;
        console.log(`Selected date: ${selectedDate}`);
        load_date_habits(selectedDate);
    });

})

function load_date_habits(date){
    // Emptying the HTML so multiple searches don't stack on each other
    document.querySelector('#content').innerHTML = "";
    document.querySelector('#message').innerHTML = "";
    document.querySelector('#error-message').innerHTML = "";

    fetch("/history", {
        method: 'POST',
        headers:{
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
        },
        body: JSON.stringify({
            selected_date: date
        })
    })
    .then(response => response.json())
    .then(result => {
        const toast = document.getElementById("toast");
        const toast_content = document.getElementById("toast-content");
        const trigger = new bootstrap.Toast(toast);
        if (result.error != undefined && result.error.length > 0){
            console.log(result.error);
            toast_content.innerHTML = `No history data was found on ${date}!`;
            trigger.show();
        }
        else{
            console.log("There are results for your queue!");
            console.log(result);

            toast_content.innerHTML = `Found history data on ${date}!`;
            trigger.show();

            const table_heads = document.createElement('div');
            table_heads.className = 'history-box row';
            table_heads.id = 'history-tableheads';
            table_heads.innerHTML = `<div class="col-2 fw-bold"> DATE</div>
                                    <div class="col-3 fw-bold"> TASK </div>
                                    <div class="col-2 fw-bold"> DONE? </div>
                                    <div class="col-5 d-flex justify-content-center fw-bold"> NOTES </div>`;

            document.querySelector('#content').append(table_heads);

            // Generate HTML with the obtained information
            result.tracked_tasks.forEach(task => list_entries(task));
        }
        
    })
}

function list_entries(data){
    console.log("Generating HTML...");
    const entry = document.createElement('div');
    entry.className = "history-box row align-items-center";

    var completed = "No"; 
    if (data.tick == true){
        completed = "Yes";
    } else {
        completed = "No";
    }

    var notes = "...";
    if (data.notes.length > 0){
        notes = data.notes;
    }

    entry.innerHTML = `<div class="col-2"> ${data.date} </div>
                            <div class="col-3"> ${data.task} </div>
                            <div class="col-2"> ${completed} </div>
                            <div class="col-5"> ${notes} </div>`;
    
    document.querySelector('#content').append(entry);
}
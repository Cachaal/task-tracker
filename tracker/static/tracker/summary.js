addEventListener('DOMContentLoaded', () => {
    console.log("Reached the Summary page");

    // CREATION OF TEMPUS DOMINUS CALENDAR
    var calendar_mode = 'month';
    var calendar = update_calendar(calendar, calendar_mode);
    const picker = document.getElementById('datetimepicker1');
    const mobile_picker = document.getElementById('mobile-calendar');
    update_mobile_calendar(mobile_picker, calendar_mode);
    const category_dropdown = document.getElementById('category-dropdown');
    var date_selected = false;
    const mode_dropdown = document.getElementById('mode-dropdown');
    console.log(calendar_mode)

    var year = 0;
    var month = 0;
    var day = 0;




    mode_dropdown.addEventListener('change', () =>{
      calendar_mode = mode_dropdown.value;
      console.log(calendar_mode);
      calendar = update_calendar(calendar, calendar_mode);
      update_mobile_calendar(mobile_picker, calendar_mode);
    })

    mobile_picker.addEventListener('change', (e) => {
      date_selected = true;
      calendar_mode = mode_dropdown.value;
      category = category_dropdown.value;
      if (calendar_mode == undefined){
        calendar_mode = "month";
      }
      console.log(e.target.value);
      const selectedDate = e.target.value;
      if (calendar_mode =='month'){
        // manual parsing when using the native calendar, since it seems to clash with timezones
        [year, month] = selectedDate.split('-').map(Number);
        day = 30;
        chart_metrics(year, month, day, calendar_mode, category);
      }
      else if (calendar_mode == 'week'){
        // manual parsing when using the native calendar, since it seems to clash with timezones
        [year, month, day] = selectedDate.split('-').map(Number);
        console.log(`${year}\n${month}\n${day}`);
        chart_metrics(year, month, day, calendar_mode, category);
      }
      else return
      });

    picker.addEventListener('change.td', (e) => {
      console.log("checking Tempus Dominus state...")
      date_selected = true;
      calendar_mode = mode_dropdown.value;
      category = category_dropdown.value;
      if (calendar_mode == undefined){
        calendar_mode = "month";
      }
      console.log(category)
      const selectedDate = e.detail.date;
      if (selectedDate != undefined || selectedDate != false){
        console.log(selectedDate);
        year = selectedDate.getFullYear();
        month = selectedDate.getMonth() + 1;
        day = selectedDate.getDate();
        console.log(`${year}\n${month}\n${day}`);
        chart_metrics(year, month, day, calendar_mode, category);
      }
      else return
      
    })
    



    category_dropdown.addEventListener("change", () => {
      category = category_dropdown.value;
      console.log(date_selected);
      if (date_selected == true){
        chart_metrics(year, month, day, calendar_mode, category);
      }
      else return
    })
})


function chart_metrics(year, month, day, mode, category){
  console.log(year);
  console.log(month);
  console.log(day);
  console.log(mode);
  console.log(category);
  fetch(`/summary`, {
    method: 'POST',
    headers:{
      'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
    },
    body: JSON.stringify({
      mode: mode,
      year: year,
      month: month, 
      day: day,
      category: category,
    })
  })
  .then(response => response.json())
  .then(result => {
    if (result.error != undefined && result.error.length > 0){
        console.log(result.error);
        document.querySelector('#error-message').innerHTML = result.error;
        document.querySelector('#message').innerHTML = `No history data was found on ${month} ${day} ${year}!`;
    }
    else{
        console.log("There are results for your queue!");
        console.log(result);


        const labels = [];
        const values = [];
        for (const key in result){
          labels.push(key);
          values.push(result[key] * 100);
         }
         console.log("Arrays:");
         console.log(labels);
         console.log(values);
         load_chart(labels, values);

    }
  })

}

function update_calendar(calendar, mode){
  // It actually doesn't update the calendar, it deletes it, and then creates a new one with the new configuration
  // Updating the Tempus Dominus doesn't seem to refresh it, this was the best alternative i found.
  if (mode == 'month'){
    if (calendar != undefined){
      calendar.dispose();
    }
    const new_picker = new tempusDominus.TempusDominus(document.getElementById('datetimepicker1'),{
      display: {
          inline: true,
          keepOpen: true,
          viewMode:'months',
          components:{
              calendar: true,
              date: false,
              month: true,
              year: true,

              clock: false, 
          },
          buttons: false
      },
      useCurrent: true,
      localization: {
          dayViewHeaderFormat: {month: 'long', year: 'numeric'},
          dateFormats: {
              L: 'yyyy-MM'
          },
          format: 'L'
      },
    })
    return new_picker;
  } else if (mode == "week"){
    calendar.dispose();
    const new_picker = new tempusDominus.TempusDominus(document.getElementById('datetimepicker1'),{
      display: {
          inline: true,
          keepOpen: true,
          viewMode:'calendar',
          components:{
              calendar: true,
              date: true,
              month: true,
              year: true,

              clock: false
          },
          buttons: false
      },
      useCurrent: true,
      localization: {
          dayViewHeaderFormat: {month: 'long', year: 'numeric'},
          dateFormats: {
              L: 'yyyy-MM-dd'
          },
          format: 'L'
      },
    })

    return new_picker;
  } else {
    return calendar;
  }

}

function update_mobile_calendar(mobile_picker, mode){
  if (mode == "week"){
    mobile_picker.type = 'date';
  }
  else if (mode == "month"){
    mobile_picker.type = 'month';
  }
  else return
}

function load_chart(new_labels, values){
  console.log("Loading new chart...")
  const ctx = document.getElementById('myChart');
  const preexisting = Chart.getChart(ctx);
 
  if (preexisting){
    preexisting.data.labels = [];
    for (const label in new_labels){
      preexisting.data.labels.push(new_labels[label]);
    }


    preexisting.data.datasets.forEach((dataset) => {
      dataset.data = [];
    });

    preexisting.data.datasets.forEach((dataset) => {
      for (const value in values){
        dataset.data.push(values[value]);
      }
    });

    preexisting.update();
  }
  else{
    Chart.defaults.color = "#fff";
    Chart.defaults.tickColor = "#fff";
    Chart.defaults.borderColor = "#7fffd4";
    Chart.defaults.backgroundColor = "rgb(60, 66, 93, 0.6)";
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: new_labels,
        datasets: [{
          label: 'Success %',
          data: values,
          borderWidth: 4,
          tension:0.2,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            grid:{
              color:"#adb4bdff",
            },
            min:40,
            max:100,
            beginAtZero: true,
            ticks: {
              callback: function(value, index, ticks){
                return value + '%';
              }
            }
          },
          
        },
        animations: {
          easing: 'linear'
          }
        
      }
    });
  }


}
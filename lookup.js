const progress = message=>{
  $('#indicator p').removeClass('error').html(message)

  // Allow to be used in promise chains
  return async a=>a;
}

const showError = message=>{
  $('#newspaper').removeClass('searching')
  $('#indicator').addClass('error')
  $('#indicator p').html(message)
  $('#search > p').html('Search again:');
}

// On page load then get city
$(document).ready(()=>{
  $('#search input[name="city"]').val('Looking up city . . .')
  $('#search input[name="city"]').attr('disabled', true);

  getUserLocation()
    .then(location=>{
      $('#search input[name="city"]').val(location.join(' '))
    })
    .catch(err=>{
      $('#search input[name="city"]').val('')
      console.error(err);
    })
    .finally(()=>{
      $('#search input[name="city"]').attr('disabled', false);
    })
})

// When search form is submitted
$('#search form').submit(ev=>{
  if(ev) ev.preventDefault();

  // Get the words
  const search = $('#search input[name="city"]').val().split(' ');
  progress('Looking up newspapers . . .');

  // Show searching progress
  $('#newspaper')
    .height(0)
    .addClass('searching')
    .addClass('hidden')
  $('#indicator').removeClass('error');

  // Look up newspapers
  getPapers(search)
    .then(progress('Populating newspaper issues . . .'))
    .then(populateIssues)
    .then(progress('Filtering for issues published today . . .'))          
    .then(filterToday)
    .then(progress('Picking issue . . .'))   
    .then(getRandomIssue)
    .then(progress('Retrieving issue information . . .'))   
    .then(getIssueFrontPage)
    // Get ready to display it
    .then(issue=>{
      progress('Loading front page image . . . ')
      // Make image object for pre-loading
      const image = $('<img/>')[0];

      // When the image is ready . . .
      $(image).on('load', ()=>{              
        // Construct newspaper div code
        const img = `
          <a target="_blank" href="${issue.htmlPage}">
            <img src="${issue.image}"/>
          </a>
        `

        // Size up how big the image is
        console.log('image loaded');
        const size = $(image).addClass('sizing').width('700px').appendTo(document.body).height();
        $(image).remove();

        const name = issue.title.name;
        let issueDate = new Date(issue.issue.date_issued.replace(/-/g, '\/'));
        // Correct for time zones
        issueDate.setMinutes(issueDate.getMinutes() + issueDate.getTimezoneOffset())
        console.log(issueDate);
        const date = issueDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        $('#search > p').html(`Found "<em>${name}</em>" from ${date}.`);

        // Show the newspaper div again
        $('#newspaper').html(img).removeClass('hidden').removeClass('searching').animate({height: size}, 500, ()=>{
          $('#newspaper').height('auto');
        });
      })

      // Start loading
      console.log('loading image: ' + issue.image)
      image.src = issue.image
    })
  .catch(error=>{
    $('#newspaper').addClass('hidden');
    console.error(error);
    showError(error.message);
  })
})
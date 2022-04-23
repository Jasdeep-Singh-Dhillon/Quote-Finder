$('.authorLink').on('click', displayAuthorInfo);

async function displayAuthorInfo() {
    let myModal = new bootstrap.Modal($('#authorModal'));
    
    let authorId = $(this).attr('id');
    // if(authorId == undefined) {
    //     // console.log('Invalid author id');
    //     return;
    // }
    let url = `/api/author/${authorId}`;
    let response = await fetch(url);
    let data = await response.json();


    $('.modal-title').html(data[0].firstName);
    $('.modal-title').append(` ${data[0].lastName}<br>`);
    $('#authorImg').html(`<img src=${data[0].portrait} width='250'><br>`);
    $('#authorInfo').html(`<b>Date of Birth:</b> ${data[0].dob.substring(0, 10)} <br>`);
    $('#authorInfo').append(`<b>Date of Death:</b> ${data[0].dod.substring(0, 10)} <br>`);
    let sex;
    if(data[0].sex == 'M'){
        sex = 'Male';
    } else {
        sex = 'Female';
    }
    $('#authorInfo').append(`<b>Sex:</b> ${sex} <br>`);
    $('#authorInfo').append(`<b>Profession:</b> ${data[0].profession} <br>`);
    $('#authorInfo').append(`<b>Country:</b> ${data[0].country} <br>`);
    $('#authorInfo').append(`<b>Biography:</b> <p>${data[0].biography}</p>`);
    myModal.show();
}
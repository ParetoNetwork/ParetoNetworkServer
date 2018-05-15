var loginService = require('./services/service');
var accessToggle = $('#access-sign');
var lookupInput = $('#lookup-input');

function dispatchView() {

    var titleField = document.getElementById('intel-title-input');
    var bodyField = document.getElementById('intel-body-input');


    var data = {};
    //data.address comes from the cookie parsed server side
    data.title = titleField.value;
    data.body = bodyField.value;
    data.block = blockNumber;
    //bodyField.summernote('code', '');


    loginService.intel(data,function (res) {
        //clear upon success
        titleField.value = '';
        //bodyField.summernote('code', '');

        var preview = document.getElementById('preview');
        if (preview !== null) {
            preview.innerHTML = '<b>' + data.content.title + '</b>' + '<br/><br/>' + data.content.body;
            preview.style.backgroundColor = 'rgba(245,245,245,1)';
        }
        console.log(res);
    }, function (error) {
        console.error(error);
    });
}


$(document).ready(function () {
    $('#intel-body-input').on('click', function (event) {
        dispatchView();
    });
    $('#intel-body-input').summernote({
        height: 300,                 // set editor height
        minHeight: null,             // set minimum height of editor
        maxHeight: null,             // set maximum height of editor
        focus: true,                 // set focus to editable area after initializing summernote
        toolbar: [
            ['font', ['bold', 'italic', 'underline'/*, 'clear'*/]],
            // ['font', ['bold', 'italic', 'underline', 'strikethrough', 'superscript', 'subscript', 'clear']],
            //['color', ['color']],
            ['para', [/*'ul', 'ol', */'paragraph']],
            //['height', ['height']],
            //['table', ['table']],
            ['insert', ['link', /*'picture',*/]],
            //['view', ['fullscreen' /*, 'codeview'*/]],
            //['help', ['help']]
        ]
    });

    $.ajax({
        method: 'GET',
        url: '/v1/auth',
        dataType: 'json',
        success: function (data, textStatus, jqXHR) {

            //if here then user authenticated, could also return address/user information.

            accessToggle.text('RESET');
            accessToggle.css('background-color', 'rgb(12, 95, 136)');
            accessToggle.css('opacity', 100);

            //set address or alias to input field and set it to read-only

        },
        error: function (jqXHR, textStatus, errorThrown) {

            console.log(errorThrown);

            accessToggle.text('ACCESS');
            accessToggle.css('background-color', 'rgb(107, 194, 123)');
            accessToggle.css('opacity', 100);

            lookupInput.val('');


        }
    }); //end ajax

}); //end document ready

window.addEventListener('revert', function () {
    //var accessValue = $("#access-toggle").value;
    //if(accessValue === "Disconnect"){

    //clear cookie and clear dashboard view and go back to access view

    $.ajax({
        method: 'POST',
        url: '/v1/unsign',
        body: {},
        dataType: 'json',
        success: function (data, textStatus, jqXHR) {

            //if here then user authenticated, could also return address/user information.
            accessToggle.text('ACCESS');
            accessToggle.css('background-color', 'rgb(107, 194, 123)');
            accessToggle.css('opacity', 100);

            lookupInput.val('');

            console.log('no signature');

        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log(errorThrown);

            lookupInput.val('');
        }
    });

});



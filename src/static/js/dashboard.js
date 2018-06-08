var loginSrv = require('./services/service.js');

var lookupInput = $('#lookup-input');


$(document).ready(function () {
    $('#logout').on('click', function (event) {
        loginSrv.logout(function (res) {
            console.log(res);
            $('#access-toggle').value = 'Access';
            console.log('no signature');

            //push to homepage

            window.location.replace('/');
        }, function (error) {
            console.error(error);
        });
    });

    loginSrv.auth(function (data) {
        //if here then user authenticated, could also return address/user information.

        $('#nav-user-access').html('&nbsp;' + data.auth.substring(0, 10) + '...&nbsp;');
        $('#dropdown-user-address').html(data.auth);

        //set address or alias to input field and set it to read-only
        address()
        loginSrv.content();
        loginSrv.myPosts();
        $.fn.dataTableExt.errMode = 'ignore';
    }, function (error) {
        window.location.replace('/');
    });

    loginSrv.leaderboard({'detail': {rank: 1, limit: 100, page: 0}});

});

function address() {
    loginSrv.scores(function (data) {
        $('#address-alias').html(data.address);
        $('#address-balance').html('&nbsp;' + data.tokens + '&nbsp;PARETO');
        if (data.tokens <= 0) {
            //run web3 count algo
        }
        $('#address-score').html('Network Rank ' + data.rank/*Number(data.score).toFixed(5)*/);
    }, function (error) {

    });
}


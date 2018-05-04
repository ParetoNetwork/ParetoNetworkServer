var loginSrv = require('./services/service');
var CountUp = require('countup.js');

var accessToggle = $('#access-sign');
var lookupInput = $('#lookup-input');

function leaderboard(e) {

    var rank = e.detail.rank;
    var limit = e.detail.limit;
    var page = e.detail.page;

    if ($.fn.dataTable.isDataTable('#pareto-leaderboard')) {
        table.destroy();
    }

    var table = $('#pareto-leaderboard').DataTable({
        searching: false,
        paging: false,
        ordering: false,
        info: false,
        scrollY: '70vh',
        scrollCollapse: false,
        ajax: {
            url: '/v1/rank?rank=' + rank + '&limit=' + limit + '&page=' + page,
            dataSrc: ''
        },
        columns: [
            {data: 'rank'},
            {
                data: 'score',
                render: $.fn.dataTable.render.number(',', '.', 2)
            },
            {data: 'address'}
        ]
    });

}

/*
 * reasons to calculate ranking server side: possible to do less API calls to the Ethereum node. possible to keep a single web socket open to the Ethereum node microservice, as opposed to thousands or an infinite number of websockets client side from users checking their ranking
 */

$(document).ready(function () {

    $.ajax({
        method: 'GET',
        url: '/v1/auth',
        dataType: 'json',
        success: function (data, textStatus, jqXHR) {

            //if here then user authenticated, could also return address/user information.

            //set address or alias to input field and set it to read-only

            $('#nav-user-access').html('&nbsp;' + data.auth.substring(0, 10) + '...&nbsp;');
            $('#dropdown-user-address').html(data.auth);


            $('#logout').css('opacity', 1.0); //logout button
            $('#access-in').css('opacity', 0.0); //signin button

            //do the thing

            //the address endpoint already has everything, as well as the sign method, so make a counting method that is faster and pulls from stored results. then the frontend bundle can be cleaner.
            score();


        },
        error: function (jqXHR, textStatus, errorThrown) {

            console.log(errorThrown);

            $('#nav-user-access').html('&nbsp;SIGN IN&nbsp;');
            $('#dropdown-user-address').html('No user authenticated');


            $('#logout').css('opacity', 0.0); //logout button
            $('#access-in').css('opacity', 1.0); //signin button

            lookupInput.val('');


        }
    }); //end ajax
    $('#logout').on('click', function (event) {
        loginSrv.logout(function (res) {
            //if here then user authenticated, could also return address/user information.
            $('#nav-user-access').html('&nbsp;SIGN IN&nbsp;');
            $('#dropdown-user-address').html('No user authenticated');

            $('#logout').css('opacity', 0.0); //logout button
            $('#access-in').css('opacity', 1.0); //signin button

            lookupInput.val('');

            console.log('no signature');
        }, function (error) {
            console.log(errorThrown);

            lookupInput.val('');
        });
    });
    $('#lookupSignButton,#access-in').on('click', function (event) {
        loginSrv.signSplash(function (data) {
            var accessToggle = document.getElementById('access-sign');
            if (accessToggle !== null) {
                accessToggle.innerHTML = 'RESET';
                accessToggle.style.backgroundColor = 'rgb(12, 95, 136)';
                accessToggle.style.opacity = 100;
            }

            var navUserAccess = document.getElementById('nav-user-access');
            var dropdownUserAccess = document.getElementById('dropdown-user-address');
            var logoutMenuItem = document.getElementById('logout');
            var signInMenuItem = document.getElementById('access-in');

            if (navUserAccess !== null) {
                navUserAccess.innerHTML = '&nbsp;' + data.result.address.substring(0, 10) + '...&nbsp;';
            }
            if (dropdownUserAccess !== null) {
                dropdownUserAccess.innerHTML = data.result.address;
            }

            if (logoutMenuItem !== null) {
                logoutMenuItem.style.opacity = '1.0'; //logout button
            }
            if (signInMenuItem !== null) {
                signInMenuItem.style.opacity = '0.0'; //signin button
            }

            leaderboard('leaderboard', {
                'detail': {
                    rank: data.result.rank,
                    limit: 100,
                    page: 0
                }
            });

            var scoreCountHolders = document.getElementById('score-counter');
            var counterOptions = {
                useEasing: true,
                useGrouping: true,
                separator: ',',
                decimal: '.',
            };
            if (scoreCountHolders !== null) {

                var scoreCount = new CountUp('score-counter', 0.0, data.result.score, 2, 2.5, counterOptions);
                if (!scoreCount.error) {

                    //would like to briefly change color and font of text

                    scoreCount.start();
                } else {
                    console.error(scoreCount.error);
                }
                if (data.rank > 0) {
                    var rankCount = new CountUp('rank-counter', data.result.totalRanks, data.result.rank, 0, 2.5, counterOptions);
                    if (rankCountInit !== 'undefined') {
                        if (!rankCount.error) {
                            rankCount.start();
                        } else {
                            console.error(rankCount.error);
                        }
                    }

                    var addressMetricsDiv = document.getElementById('address-metrics');
                    if (addressMetricsDiv !== null) {
                        addressMetricsDiv.style.opacity = 1; //For real browsers;
                        addressMetricsDiv.style.filter = 'alpha(opacity=100)'; //For IE;

                        document.getElementById('rank-total').innerHTML = data.result.totalRanks;
                    }
                }

                searchLookup();
                var lookupInputField = document.getElementById('lookup-input');
                if (lookupInputField !== 'undefined') {
                    lookupInputField.value = addr;
                }

            }
        }, function (error) {
            alert(error);

        });
    });

    leaderboard({'detail': {rank: 1, limit: 100, page: 0}});
});

function score() {
    loginSrv.scores(function (data) {
        var scoreCountHolders = document.getElementById('score-counter');
        var counterOptions = {
            useEasing: true,
            useGrouping: true,
            separator: ',',
            decimal: '.',
        };
        if (scoreCountHolders !== null) {

            var scoreCount = new CountUp('score-counter', 0.0, data.score, 2, 2.5, counterOptions);
            if (!scoreCount.error) {

                //would like to briefly change color and font of text

                scoreCount.start();
            } else {
                console.error(scoreCount.error);
            }
            if (data.rank > 0) {
                if (data.totalRanks == undefined) {

                } else {
                    var rankCount = new CountUp('rank-counter', data.totalRanks, data.rank, 0, 2.5, counterOptions);
                    if (scoreCount !== 'undefined') {
                        if (!rankCount.error) {
                            rankCount.start();
                        } else {
                            console.error(rankCount.error);
                        }
                    }

                    var addressMetricsDiv = document.getElementById('address-metrics');
                    if (addressMetricsDiv !== null) {
                        addressMetricsDiv.style.opacity = 1; //For real browsers;
                        addressMetricsDiv.style.filter = 'alpha(opacity=100)'; //For IE;

                        document.getElementById('rank-total').innerHTML = data.totalRanks;
                    }
                }// end else

            }//end if rank > 0
        } //end score div che
    }, function (error) {
        console.error(error);
    });
}


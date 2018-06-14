var loginSvr = require('./services/service');
window.Snap = Snap;
var bottom_wave = window.Snap('#bottom-wave');
var b_w = window.Snap.select('.down-wave');
animateBottomWave();

function animateBottomWave() {

    b_w.animate({
        d: 'M0,0c0,3,0,27.5,0,30.5c115.2,39,244.5,54.6,630.5,12.6c262-28.5,461-42.4,863.4-41.8c0-3.2,0,1.9,0-1.4H0z'
    }, 12e3, mina.easeinout, resetBottomWave);
}

function resetBottomWave() {
    b_w.animate({
        d: 'M0,0c0,3,0,6,0,9c249,0.6,500.1,34.6,750.3,55.1c250.2,20.6,472.3,13.3,743.7-44.2c0-3.2,0-16.7,0-19.9H0z'
    }, 8e3, mina.easeinout, animateBottomWave);
}

var top_wave = window.Snap('#top-wave');
var t_w = window.Snap.select('.top-wave');
animateTopWave();

function animateTopWave() {
    t_w.animate({
        d: 'M1493.9,39.9c-135.4-22-229-51.2-497.4-32C717.5,28,291.7,76.1,0,73.6l0,0c0,7.7,0,0,0,6.2h1493.9C1493.9,72.1,1493.9,47.7,1493.9,39.9z'
    }, 9e3, mina.easeinout, resetTopWave);
}

function resetTopWave() {
    t_w.animate({
        d: 'M1493.9,56.7C1245,57,986.7,27.5,731.1,9.4C475.4-8.8,229.1-4.2,0,56.7h0c0,7.7,0,15.5,0,23.2h1493.9C1493.9,72.1,1493.9,64.4,1493.9,56.7z'
    }, 4e3, mina.easeinout, animateTopWave);
}

var g_bottom_wave = window.Snap('#green-bottom-wave');
var g_b_w = window.Snap.select('.green-down-wave');
g_animateBottomWave();

function g_animateBottomWave() {
    g_b_w.animate({
        d: 'M0,0c0,3,0,27.5,0,30.5c115.2,39,244.5,54.6,630.5,12.6c262-28.5,461-42.4,863.4-41.8c0-3.2,0,1.9,0-1.4H0z'
    }, 12e3, mina.easeinout, g_resetBottomWave);
}

function g_resetBottomWave() {
    g_b_w.animate({
        d: 'M0,0c0,3,0,6,0,9c249,0.6,500.1,34.6,750.3,55.1c250.2,20.6,472.3,13.3,743.7-44.2c0-3.2,0-16.7,0-19.9H0z'
    }, 8e3, mina.easeinout, g_animateBottomWave);
}

var g_top_wave = window.Snap('#green-top-wave');
var g_t_w = window.Snap.select('.green-top-wave');
g_animateTopWave();

function g_animateTopWave() {
    g_t_w.animate({
        d: 'M1493.9,39.9c-135.4-22-229-51.2-497.4-32C717.5,28,291.7,76.1,0,73.6l0,0c0,7.7,0,0,0,6.2h1493.9C1493.9,72.1,1493.9,47.7,1493.9,39.9z'
    }, 9e3, mina.easeinout, g_resetTopWave);
}

function g_resetTopWave() {
    g_t_w.animate({
        d: 'M1493.9,56.7C1245,57,986.7,27.5,731.1,9.4C475.4-8.8,229.1-4.2,0,56.7h0c0,7.7,0,15.5,0,23.2h1493.9C1493.9,72.1,1493.9,64.4,1493.9,56.7z'
    }, 4e3, mina.easeinout, g_animateTopWave);
}

function sign() {
    loginSvr.signSplash(function (data) {
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
    }, function (error) {
        alert(error);
    });
}

function logout() {
    loginSvr.logout(function (data) {
        $('#nav-user-access').html('&nbsp;SIGN IN&nbsp;');
        $('#dropdown-user-address').html('No user authenticated');

        $('#logout').css('opacity', 0.0); //logout button
        $('#access-in').css('opacity', 1.0); //signin button

    }, function (error) {
        console.error(error);
    });
}

$(document).ready(function () {

    loginSvr.auth(function (data) {
        //if here then user authenticated, could also return address/user information.

        //set address or alias to input field and set it to read-only

        $('#nav-user-access').html('&nbsp;' + data.auth.substring(0, 10) + '...&nbsp;');
        $('#dropdown-user-address').html(data.auth);


        $('#logout').css('opacity', 1.0); //logout button
        $('#access-in').css('opacity', 0.0); //signin button

        //do the thing

    }, function (error) {
        console.log(error);

        $('#nav-user-access').html('&nbsp;SIGN IN&nbsp;');
        $('#dropdown-user-address').html('No user authenticated');


        $('#logout').css('opacity', 0.0); //logout button
        $('#access-in').css('opacity', 1.0); //signin button

    });//end ajax

    $('#logout').on('click', function (e) {
        logout();
    });
    $('#access-in').on('click', function (e) {
        sign();
    });
});


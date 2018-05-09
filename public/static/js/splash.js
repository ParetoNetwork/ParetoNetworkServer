/*var b_w = Snap.select('.down-wave');
var bottom_wave = Snap("#bottom-wave");

animateBottomWave();
function animateBottomWave(){
    b_w.animate({
        d: 'M0,0c0,3,0,27.5,0,30.5c115.2,39,244.5,54.6,630.5,12.6c262-28.5,461-42.4,863.4-41.8c0-3.2,0,1.9,0-1.4H0z'
    }, 12e3, mina.easeinout, resetBottomWave);
}
function resetBottomWave(){
    b_w.animate({
        d: 'M0,0c0,3,0,6,0,9c249,0.6,500.1,34.6,750.3,55.1c250.2,20.6,472.3,13.3,743.7-44.2c0-3.2,0-16.7,0-19.9H0z'
    }, 8e3, mina.easeinout, animateBottomWave);
}
var top_wave = Snap('#top-wave');
var t_w = Snap.select('.top-wave');
animateTopWave();
function animateTopWave(){
    t_w.animate({
        d: 'M1493.9,39.9c-135.4-22-229-51.2-497.4-32C717.5,28,291.7,76.1,0,73.6l0,0c0,7.7,0,0,0,6.2h1493.9C1493.9,72.1,1493.9,47.7,1493.9,39.9z'
    }, 9e3, mina.easeinout, resetTopWave);
}
function resetTopWave(){
    t_w.animate({
        d: 'M1493.9,56.7C1245,57,986.7,27.5,731.1,9.4C475.4-8.8,229.1-4.2,0,56.7h0c0,7.7,0,15.5,0,23.2h1493.9C1493.9,72.1,1493.9,64.4,1493.9,56.7z'
    }, 4e3, mina.easeinout, animateTopWave);
}

var g_bottom_wave = Snap("#green-bottom-wave");
var g_b_w = Snap.select('.green-down-wave');
g_animateBottomWave();
function g_animateBottomWave(){
    g_b_w.animate({
        d: 'M0,0c0,3,0,27.5,0,30.5c115.2,39,244.5,54.6,630.5,12.6c262-28.5,461-42.4,863.4-41.8c0-3.2,0,1.9,0-1.4H0z'
    }, 12e3, mina.easeinout, g_resetBottomWave);
}
function g_resetBottomWave(){
    g_b_w.animate({
        d: 'M0,0c0,3,0,6,0,9c249,0.6,500.1,34.6,750.3,55.1c250.2,20.6,472.3,13.3,743.7-44.2c0-3.2,0-16.7,0-19.9H0z'
    }, 8e3, mina.easeinout, g_animateBottomWave);
}
var g_top_wave = Snap('#green-top-wave');
var g_t_w = Snap.select('.green-top-wave');
g_animateTopWave();
function g_animateTopWave(){
    g_t_w.animate({
        d: 'M1493.9,39.9c-135.4-22-229-51.2-497.4-32C717.5,28,291.7,76.1,0,73.6l0,0c0,7.7,0,0,0,6.2h1493.9C1493.9,72.1,1493.9,47.7,1493.9,39.9z'
    }, 9e3, mina.easeinout, g_resetTopWave);
}
function g_resetTopWave(){
    g_t_w.animate({
        d: 'M1493.9,56.7C1245,57,986.7,27.5,731.1,9.4C475.4-8.8,229.1-4.2,0,56.7h0c0,7.7,0,15.5,0,23.2h1493.9C1493.9,72.1,1493.9,64.4,1493.9,56.7z'
    }, 4e3, mina.easeinout, g_animateTopWave);
}*/
var accessToggle = $('#access-sign');
var loginSrv = require('./services/service.js');

function stopLoading(id, text) {
    var elem = document.getElementById('gradient');
    var button = $('.button.button--transparent');
    button.empty();
    button.append(text);
    elem.style.width = '101%';
    clearInterval(id);
}

function Loading() {
    var button = $('.button.button--transparent');
    var text = $('.button.button--transparent > b');
    button.empty();
    button.append('<i class="fa fa-spinner fa-spin"></i>');
}

function frame() {
    var elem = document.getElementById('gradient');
    var width = parseInt(elem.style.width);
    if (width >= 90) {
    } else {
        width++;
        elem.style.width = width + '%';
    }
}


$(document).ready(function () {
    $('.button--login').on('click', function (event) {
        var text = $('.button.button--transparent > b');
        var elem = document.getElementById('gradient');
        elem.style.width = '1%';
        var id = setInterval(frame, 10);
        Loading();

        console.log(loginSrv);
        loginSrv.signSplash(function (res) {
            console.log(res);
            window.location.replace('/dashboard');
            stopLoading(id, text);
        }, function (error) {
            alert(error);
            stopLoading(id, text);
        });
    });


});
// Global parameters
window.params = {
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    isIOS: /iPhone|iPad|iPod/i.test(navigator.userAgent)
};


/**
     *
     * Check if element exist on page
     *
     * @param el {string} jQuery object (#popup)
     *
     * @return {bool}
     *
*/
function exist(el){
    if ( $(el).length > 0 ) {
        return true;
    } else {
        return false;
    }
}


jQuery(document).ready(function($) {

    /*---------------------------
                                  ADD CLASS ON SCROLL
    ---------------------------*/
    $(function() { 
        var $document = $(document),
            $element = $('.toggle-menu'),
            $element2 = $('header'),
            className = 'hasScrolled';

        $document.scroll(function() {
            $element.toggleClass(className, $document.scrollTop() >= 1);
            $element2.toggleClass(className, $document.scrollTop() >= 1);
        });
    });

particlesJS('particles-js', {
  canvas: {
    color_hex_bg: '#3E3E3E',
    opacity: 1
  },
  particles: {
    color: '#3E3E3E',
    color_hex: '#3E3E3E',
    opacity: .8,
    size: 4,
    size_random: true,
    nb: 240,
    anim: {
      speed: 1.5
    },
    line_linked: {
        enable_auto: true,
        distance: 120,
        color: '#3E3E3E',
        opacity: .8,
        width: 1,
        condensed_mode: {
          enable: true,
          rotateX: 65000,
          rotateY: 65000
        }
      }
  },
  retina_detect: true
});



    /*---------------------------
                                  File input logic
    ---------------------------*/
    $('input[type=file]').each(function(index, el) {
        $(this).on('change', function(event) {
            event.preventDefault();
            var placeholder = $(this).siblings('.placeholder');
        
            if ( this.files.length > 0 ) {
                if ( this.files[0].size < 5000000 ) {
                    var filename = $(this).val().split('/').pop().split('\\').pop();
                    if ( filename == '' ) {
                        filename = placeholder.attr('data-label');
                    }
                    placeholder.text(filename);
                } else {
                    alert('Maximum file size is 5Mb');
                }    
            } else {
                placeholder.text( placeholder.attr('data-label') );
            }
            
        });
    });
    
    /*---------------------------
                                PAGE ANCHORS
    ---------------------------*/
    $('.page-menu a, .anchor').click(function() {
        $('html, body').animate({
            scrollTop: $($(this).attr('href')).offset().top - 50
        }, 800);
        return false;
    });


    /*---------------------------
                                    Accordeon
    ---------------------------*/
    $('.js-faq-handler').on('click', function(event) {
        event.preventDefault();
        var content = $(this).siblings('.faq-item-content');
        $('.js-faq-handler').not($(this)).removeClass('is-open');
        $('.faq-item-content').not(content).slideUp();
        $(this).toggleClass('is-open');
        content.slideToggle();
    });


    /*---------------------------
                                    Fade-in-reviews
    ---------------------------*/
    $('.review').each(function(index, el) {
        $(this).delay(1000 * index).queue(function(next){
            $(this).addClass('is-visible')
            next();
        });
        $(this).delay(1000 * index + 1000).queue(function(next){
            $(this).css('opacity', '1');
            $(this).removeClass('is-visible')
            next();
        });
    });


    $('.review').hover(function(){
            var self = this;
            mytime = setTimeout(function(){
                $(self).css({
                    'animation': 'bounce2 1.5s'
                });
            }, 200);
        },
        function(){
            var self = this;
            $(self).css({
                'animation': 'none'
            });
            clearTimeout(mytime);
        }
    );

    /*---------------------------
                                    Timer
    ---------------------------*/
    var endDate = new Date( $('.timer').attr('data-end') );
    $('.timer').countdown({
        until: endDate,
        padZeroes: true,
        format: 'dHMS',
        layout: '<span class="timer-section">'+
                    '<span class="timer-digits">'+
                        '<span>{d10}</span>'+
                        '<span>{d1}</span>'+
                    '</span>'+
                    '<span class="timer-section-label">{dl}</span>'+
                '</span>'+
                '<span class="timer-section">'+
                    '<span class="timer-digits">'+
                        '<span>{h10}</span>'+
                        '<span>{h1}</span>'+
                    '</span>'+
                    '<span class="timer-section-label">{hl}</span>'+
                '</span>'+
                '<span class="timer-section">'+
                    '<span class="timer-digits">'+
                        '<span>{m10}</span>'+
                        '<span>{m1}</span>'+
                    '</span>'+
                    '<span class="timer-section-label">{ml}</span>'+
                '</span>'+
                '<span class="timer-section">'+
                    '<span class="timer-digits">'+
                        '<span>{s10}</span>'+
                        '<span>{s1}</span>'+
                    '</span>'+
                    '<span class="timer-section-label">{sl}</span>'+
                '</span>'
    }); 


    /*---------------------------
                                  MENU TOGGLE
    ---------------------------*/
    $('.js-toggle-menu').on('click', function(event) {
        event.preventDefault();
        $(this).toggleClass('is-active');
        $(this).siblings('header').toggleClass('open');
    });



    /*---------------------------
                                  Fancybox
    ---------------------------*/
    $('.fancybox').fancybox({
        
    });


    /**
     *
     * Open popup
     *
     * @param popup {String} jQuery object (#popup)
     *
     * @return n/a
     *
    */
    function openPopup(popup){
        $.fancybox.open([
            {
                src  : popup,
                type: 'inline',
                opts : {}
            }
        ], {
            loop : false
        });
    }



    /*---------------------------
                                  Form submit
    ---------------------------*/
    $('.ajax-form').on('submit', function(event) {
        event.preventDefault();
        var data = new FormData(this);
        $(this).find('button').prop('disabled', true);
        $.ajax({
            url: theme.url + '/forms.php',
            type: 'POST',
            data: data,
            cache: false,
            contentType: false,
            processData: false,
            success: function(result) {
                if (result.status == 'ok') {
                    openPopup('#modal-popup-ok')
                } else {
                    openPopup('#modal-popup-error')
                }
            },
            error: function(result) {
                openPopup('#modal-popup-error');
            }
        }).always(function() {
            $('form').each(function(index, el) {
                $(this)[0].reset();
                $(this).find('button').prop('disabled', false);
            });
        });
    });


}); // end file
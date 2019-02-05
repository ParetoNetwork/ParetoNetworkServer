<template>
    <div class="content position-relative marketplace-section">
        <div class="wide-title">
            <h2 class="font-header">A true peer-to-peer content marketplace.</h2>
            <p class="subtitle font-body">The Pareto Network is the first real-time actionable intelligence platform for
                investors. </p>
        </div>

        <div id="particles-js"></div>

        <div class="wrapper">
            <div class="reviews-block font-body">

                <div class="css-script-clear"></div>

                <div class="review" style="left: 60px; top: 0;">
                    <div class="review__avatar"><img src="../assets/images/p1.png" alt=""></div>
                    <div class="review__content">
                        <p>Proxy trade Apple's (AAPL) earnings report using SPY 11/2 $270 Straddle to avoid IV crush, thanks to heavy weighting and correlation.</p>
                        <p align="right" style="color: orange;">est. reward <b style="font-size: 20px; color: #008000">$15,000</b>
                        </p>
                    </div>
                </div> <!-- end review -->

                <div class="review" style="left: 40%; top: 6%;">
                    <div class="review__avatar"><img src="../assets/images/p5.jpg" alt=""></div>
                    <div class="review__content">
                        <p>NEO transaction demand from new AI infrastructure will affect GAS prices 35% according this
                            analysis</p>
                        <p align="right" style="color: orange;">est. reward <b style="font-size: 20px; color: #008000">$8,300</b>
                        </p>
                    </div>
                </div> <!-- end review -->

                <div class="review" style="left: 50%; top: 35%;">
                    <div class="review__avatar"><img src="../assets/images/p2.jpg" alt=""></div>
                    <div class="review__content">
                        <p>Large Tesla (TSLA) director sales detected in Form 4, open $300 strike puts with expiration 70 days out.</p>
                        <p align="right" style="color: orange;">est. reward <b style="font-size: 20px; color: #008000">$200,000</b>
                        </p>
                    </div>
                </div> <!-- end review -->

                <div class="review" style="left: 30%; top: 65%;">
                    <div class="review__avatar"><img src="../assets/images/p3.jpg" alt=""></div>
                    <div class="review__content">
                        <p>Vulnerability in Monero affects all cryptonote forks. Here are the coins that haven’t
                            updated</p>
                        <p align="right" style="color: orange;">est. reward <b style="font-size: 20px; color: #008000">$35,000</b>
                        </p>
                    </div>
                </div> <!-- end review -->

                <div class="review" style="left: 75%; top: 55%;">
                    <div class="review__avatar"><img src="../assets/images/p4.jpg" alt=""></div>
                    <div class="review__content">
                        <p>Chinese government planning to announce eased restrictions on cryptocurrencies, opening
                            capital flows by 250%</p>
                        <p align="right" style="color: orange;">est. reward <b style="font-size: 20px; color: #008000">$120,000</b>
                        </p>
                    </div>
                </div> <!-- end review -->

            </div> <!-- end reviews-block -->
        </div>
    </div>

</template>

<script>
    /* eslint-disable */

    export default {
        name: 'VParticles',
        mounted: function () {
            require('particles.js');
            this.$nextTick(() => {
                this.initParticleJS();
                this.loadView();
            });
        },
        methods: {
            initParticleJS() {
                particlesJS('particles-js', {
                    particles: {
                        number: {
                            value: 240,
                            density: {
                                enable: true,
                                value_area: 800
                            }
                        },
                        color: {
                            value: '#3e3e3e'
                        },
                        shape: {
                            type: 'circle',
                            stroke: {
                                width: 0,
                                color: '#000000'
                            },
                            polygon: {
                                nb_sides: 5
                            },
                            image: {
                                src: 'img/github.svg',
                                width: 100,
                                height: 100
                            }
                        },
                        opacity: {
                            value: 0.8,
                            random: false,
                            anim: {
                                enable: false,
                                speed: 1,
                                opacity_min: 0.1,
                                sync: false
                            }
                        },
                        size: {
                            value: 4,
                            random: true,
                            anim: {
                                enable: false,
                                speed: 40,
                                size_min: 0.1,
                                sync: false
                            }
                        },
                        line_linked: {
                            enable: true,
                            distance: 120,
                            color: '#3e3e3e',
                            opacity: 0.8,
                            width: 1
                        },
                        move: {
                            enable: true,
                            speed: 1.5,
                            direction: 'none',
                            random: false,
                            straight: false,
                            out_mode: 'out',
                            bounce: false,
                            attract: {
                                enable: false,
                                rotateX: 10000,
                                rotateY: 10000
                            }
                        }
                    },
                    interactivity: {
                        detect_on: 'canvas',
                        events: {
                            onhover: {
                                enable: false,
                                mode: 'repulse'
                            },
                            onclick: {
                                enable: false,
                                mode: 'push'
                            },
                            resize: true
                        },
                        modes: {
                            grab: {
                                distance: 400,
                                line_linked: {
                                    opacity: 1
                                }
                            },
                            bubble: {
                                distance: 400,
                                size: 40,
                                duration: 2,
                                opacity: 8,
                                speed: 3
                            },
                            repulse: {
                                distance: 200,
                                duration: 0.4
                            },
                            push: {
                                particles_nb: 4
                            },
                            remove: {
                                particles_nb: 2
                            }
                        }
                    },
                    retina_detect: true
                });
            },loadView(){
                let mytime;
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
                }).hover(function(){
                        const self = this;
                        mytime = setTimeout(function(){
                            $(self).css({
                                'animation': 'bounce2 1.5s'
                            });
                        }, 200);
                    },
                    function(){
                        const self = this;
                        $(self).css({
                            'animation': 'none'
                        });
                        clearTimeout(mytime);
                    }
                );
            }
        }
    };
</script>

<style scoped lang="scss">
    @import "../styles/variables";


    .wide-title {
        color: $blue-light;
        p {
            color: $green-light;
        }
    }
</style>
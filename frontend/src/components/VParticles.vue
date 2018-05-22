<template>
    <div class="">

        <div class="wide-title">
            <h2 class="font-header">We built a true peer-to-peer content marketplace.</h2>
            <p class="subtitle font-body">The Pareto Network is the first real-time actionable intelligence platform for
                investors. </p>
        </div>
        <div class="position-relative">

            <div id="particles-js" class=""></div>
            <div class="test-container">
                <div class="container d-lg-block d-md-flex">

                    <div class="css-script-clear"></div>

                    <div class="review" style="left: 60px; top: 0;">
                        <div class="review__avatar"><img src="../assets/images/p1.png" alt=""></div>
                        <div class="review__content">
                            <p>Critical bug found in new hardware wallet, effects 10% of market. Here are the details to
                                execute
                                or short.</p>
                            <p align="right" style="color: orange;">est. reward <b
                                    style="font-size: 20px; color: #008000">$15,000</b>
                            </p>
                        </div>
                    </div> <!-- end review -->

                    <div class="review" style="left: 40%; top: 6%;">
                        <div class="review__avatar"><img src="../assets/images/p5.jpg" alt=""></div>
                        <div class="review__content">
                            <p>NEO transaction demand from new AI infrastructure will affect GAS prices 35% according
                                this
                                analysis</p>
                            <p align="right" style="color: orange;">est. reward <b
                                    style="font-size: 20px; color: #008000">$8,300</b>
                            </p>
                        </div>
                    </div> <!-- end review -->

                    <div class="review" style="left: 50%; top: 35%;">
                        <div class="review__avatar"><img src="../assets/images/p2.jpg" alt=""></div>
                        <div class="review__content">
                            <p>How to double spend on the IOTA tangle, before everyone else figures it out</p>
                            <p align="right" style="color: orange;">est. reward <b
                                    style="font-size: 20px; color: #008000">$200,000</b>
                            </p>
                        </div>
                    </div> <!-- end review -->

                    <div class="review" style="left: 30%; top: 65%;">
                        <div class="review__avatar"><img src="../assets/images/p3.jpg" alt=""></div>
                        <div class="review__content">
                            <p>Vulnerability in Monero affects all cryptonote forks. Here are the coins that haven’t
                                updated</p>
                            <p align="right" style="color: orange;">est. reward <b
                                    style="font-size: 20px; color: #008000">$35,000</b>
                            </p>
                        </div>
                    </div> <!-- end review -->

                    <div class="review" style="left: 75%; top: 55%;">
                        <div class="review__avatar"><img src="../assets/images/p4.jpg" alt=""></div>
                        <div class="review__content">
                            <p>Chinese government planning to announce eased restrictions on cryptocurrencies, opening
                                capital
                                flows by 250%</p>
                            <p align="right" style="color: orange;">est. reward <b
                                    style="font-size: 20px; color: #008000">$120,000</b>
                            </p>
                        </div>
                    </div> <!-- end review -->

                </div> <!-- end reviews-block -->
            </div>
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
            }
        }
    };
</script>

<style scoped lang="scss">
    @import "../styles/variables";
    .review {
        position: relative;
        width: 212px;
        -webkit-box-shadow: 0px 0px 25px 0px rgba(0, 0, 0, 0.15);
        box-shadow: 0px 0px 25px 0px rgba(0, 0, 0, 0.15);
        background-color: #FFF;
        color: #679ab4;
        font-weight: 700;
        line-height: 1.5;
        border-radius: 8px;
        padding: 15px;
        pointer-events: auto;
    }
    #particles-js{
        display: block;
        @media (max-width: 991px) {
            display: none;
        }
    }
    .review__avatar {
        width: 46px;
        height: 46px;
        border-radius: 50%;
        overflow: hidden;
        position: absolute;
        bottom: 20px;
        left: -60px;
        -webkit-transform: translateY(50%);
        -ms-transform: translateY(50%);
        transform: translateY(50%)
    }
    @media (max-width: 991px) {
        .review__avatar {
            position: static;
            -webkit-transform: none;
            -ms-transform: none;
            transform: none;
            margin: 0 auto 15px
        }
    }
    .review__avatar img {
        display: block;
        width: 100%
    }
    .test-container{
        position: absolute !important;
        top: 0;
        width: 100%;
    }
    
    .wide-title{
        color: $blue-light;
        p{
            color: $green-light;
        }
    }
</style>
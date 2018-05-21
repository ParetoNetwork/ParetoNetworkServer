<template>
    <div class="">
        <header class="offer" style="height:100%;">
            <div class="content" style="height:100%; display: flex; align-items: flex-end;">
                <div class="overlay"></div>
                <div>
                    <video preload="metadata" loop muted autoplay playsinline>
                        <source src="../assets/download/Pareto-Introduction.mp4" type="video/mp4">
                        <img src="../assets/images/overlay.png" title="">
                    </video>
                </div>

                <div class="wrapper d-flex align-items-end p-5">
                    <div class="row middle-xs">
                        <div class="col-xs-12 col-sm-12 col-md-6">

                            <div class="site-moto">
                                <img src="../assets/images/LogoReverse.svg" style="width: 400px; max-width: 100%;"
                                     malt="">
                                <h1 class="font-body">Current, reputable & actionable intel for digital currency traders
                                    and investors.
                                    <br/>
                                </h1>
                            </div>

                        </div>
                        <div class="col-xs-12 col-sm-12 col-md-6">
                            <div class="site-moto font-body conditional-center">
                                <!-- <center>
                                    <div class="video-box">
                                        <iframe style="width: 100%; height: 100%;" src="https://www.youtube.com/embed/j6MFoSQkT7U?rel=0&amp;showinfo=0" frameborder="0" allowfullscreen></iframe>
                                    </div>

                                </center>
                                -->

                                <div class="font-body"><h1 style="font-size: 25px; font-weight: bold">Post. Trade.
                                    Earn.</h1></div>
                                <br/>

                                <button class="button button--transparent button--login"
                                        style="font-size: 18px; background-color:rgb(107, 194, 123); width:200px;"><b>Access</b>
                                </button>
                                <br/>
                                <div class="font-body"><h6 style="font-size: 12px;">Requires a PARETO platform
                                    license.<br/> More information <a
                                            style="text-decoration: underline; font-weight: bold; text-size: 16px; color: white;"
                                            href="https://blog.pareto.network/how-to-access-the-pareto-network-with-a-web3-browser-8c7dfa917c0b">here.</a>
                                    <!-- Purchase from these <a style="text-decoration: underline; font-weight: bold; text-size: 16px;" href="https://coinmarketcap.com/currencies/pareto-network/#markets">active markets.</a> -->
                                </h6></div>
                            </div>

                        </div>

                    </div>
                    <br/>
                    <br/>
                    <br/>
                </div>
            </div>
            <svg id="offer-wave" x="0px" y="0px" viewBox="0 0 1400 37" style="enable-background:new 0 0 1400 37;     fill: #679ab4
" xml:space="preserve">
                <path class="offer-wave" d="M0,0h1400c0,0-332.5,37-570.4,37c-202.6,0-390-7.4-390-7.4S255.8,30.1,194.5,29C98.3,27.3,0,11.7,0,11.7V0z"/>
            </svg>
        </header><!-- end offer section -->

        <div id="particles-js" class="mb-5"></div>
        <div class="footer-apps">
            <h4 class="font-body">Follow on Social Media</h4>

            <div class="footer-apps__row">
                <a href="https://t.me/paretonetworkdiscussion" class="app-icon telegram" target="_blank"><i
                        class="fa fa-paper-plane" aria-hidden="true"></i></a>
                <!-- <a href="https://fb.me/paretonetworkofficial" class="app-icon facebook" target="_blank"><i class="fa fa-facebook" aria-hidden="true"></i></a>
                <a href="https://www.linkedin.com/company/11252108/" class="app-icon linkedin" target="_blank"><i class="fa fa-linkedin" aria-hidden="true"></i></a>
                <a href="https://github.com/ParetoNetwork" class="app-icon git" target="_blank"><i class="fa fa-github" aria-hidden="true"></i></a>
                 -->
                <a href="https://blog.pareto.network/" class="app-icon medium" target="_blank"><i class="fa fa-medium"
                                                                                                  aria-hidden="true"></i></a>
                <a href="https://twitter.com/ParetoNetwork" class="app-icon twitter" target="_blank"><i
                        class="fa fa-twitter" aria-hidden="true"></i></a>
                <a href="https://www.youtube.com/channel/UCWbAwsAEmNksqhhDlgBaSQA" class="app-icon youtube"
                   target="_blank"><i class="fa fa-youtube" aria-hidden="true"></i></a>


            </div>
            <br/>
            <br/>
            <div class="footer-apps__row">
                <form action="https://network.us17.list-manage.com/subscribe/post?u=4cb27761708b4fe0c548f1151&amp;id=41974997b2"
                      method="post" id="mc-embedded-subscribe-form" name="mc-embedded-subscribe-form"
                      class="validate sign-up-form" style="padding-left: 0px;" target="_blank" novalidate>
                    <p class="sign-up-form__title font-header" style="color: #679ab4;">Receive updates about Pareto</p>

                    <div class="form-group">
                        <input style="background-color: " type="email" value="" name="EMAIL" required=""
                               placeholder="Email address" class="required email" id="mce-EMAIL">
                        <input type="hidden" name="b_4cb27761708b4fe0c548f1151_41974997b2" tabindex="-1" value="">
                        <button class="submit-button" type="submit" value="Subscribe" name="subscribe"
                                id="mc-embedded-subscribe">Go
                        </button>
                        <div id="mce-responses" class="clear">
                            <div class="response" id="mce-error-response" style="display:none"></div>
                            <div class="response" id="mce-success-response" style="display:none"></div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script>
    /* eslint-disable */

    export default {
        name: 'SplashDashboard',
        components: {},
        data() {
            return {
                message: 'Hello Vue.js!'
            };
        },
        mounted() {
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

<style lang="scss" scoped>
    .wide-title {
        height: 100vh;
    }

    .overlay {
        position: absolute;
        background: url('../assets/images/overlayblend.png');
        background-size: 100% 100%;
        top: 0px;
        left: 0px; /* fixed to left. Replace it by right if you want.*/
        height: 75vh;
        z-index: -1;
    }

    .offer .content:after {
        content: '';
        width: 619px;
        height: 100vh;
        /*background-image: url(../images/star.svg);*/
        background-position: 50% 50%;
        background-repeat: no-repeat;
        background-size: 100%;
        position: absolute;
        top: 45%;
        left: 65%;
        -webkit-transform: translate(-50%, -50%);
        -ms-transform: translate(-50%, -50%);
        transform: translate(-50%, -50%);
        z-index: -1
    }

    video {
        position: absolute;
        background: url('../assets/images/whitespacer.png');
        background-size: 100% 100%;
        top: 0px;
        left: 0px; /* fixed to left. Replace it by right if you want.*/
        min-width: 100%;
        min-height: 100%;
        width: auto;
        height: auto;
        z-index: -2;
    }

    .wrapper {
        height: 91vh;
    }
</style>
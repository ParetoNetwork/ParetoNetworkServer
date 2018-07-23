<template>
    <div class="head">

        <div
                id="gradient"
                class="bar">&nbsp;
        </div>

        <nav class="navbar navbar-expand-lg navbar-dark header font-weight-bold font-body text-white">
            <router-link tag="a" class="navbar-brand" to="/"><img
                    src="../assets/images/LogoReverse.svg"
                    width="150"
                    class="d-inline-block align-top"
                    alt=""></router-link>
            <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent"
                    aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>

            <div class="collapse navbar-collapse justify-content-lg-end" id="navbarSupportedContent">
                <ul class="navbar-nav ">
                    <li class="nav-item mx-lg-4" v-on:click="collapseContent()">
                        <router-link tag="a" class="nav-link" :active-class="'active'" to="/dashboard" exact>Intel
                        </router-link>
                    </li>
                    <li class="nav-item mx-lg-4" v-on:click="collapseContent()">
                        <router-link tag="a" class="nav-link" :active-class="'active'" to="/leaderboards">Leaderboards
                        </router-link>
                    </li>
                    <li class="nav-item mx-lg-4" v-on:click="collapseContent()">
                        <router-link tag="a" class="nav-link" :active-class="'active'" to="/about">About</router-link>


                    </li>
                    <li class="nav-item dropdown mx-lg-4 active">
                        <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button"
                           data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                            <i class="fa fa-user">&nbsp;</i>
                            <span v-if="address">
                                {{address.slice(0,10) + '...'}}
                            </span>
                            <span v-else>SIGN IN</span>
                        </a>
                        <div class="dropdown-menu dropdown-menu-right" style="font-size: 11px"
                             aria-labelledby="navbarDropdown">
                            <a v-if="address" class="dropdown-item" href="#">{{address}}</a>
                            <a v-else class="dropdown-item disabled" href="#">No user AUTHENTICATED</a>
                            <a v-if="!isLogged" class="dropdown-item" href="#" v-on:click="login()">MetaMask</a>
                            <a v-if="!isLogged" class="dropdown-item" href="#" v-on:click="manual()">Manually</a>

                            <a v-else class="dropdown-item" href="#" v-on:click="logout()">Logout</a>

                        </div>
                    </li>
                </ul>
            </div>
        </nav>
    </div>

</template>

<script>
    /* eslint-disable no-console */
    import {mapMutations, mapState} from 'vuex';
    import 'jquery'
    import authService from '../services/authService';
    import dashboardService from '../services/dashboardService';


    export default {
        name: 'Navbar',
        components: {},
        mounted: function () {
            dashboardService.getAddress(res => {
                this.address = res;
                this.$store.dispatch({
                    type: 'login',
                    data: {address: res.address}
                });
            }, () => {

                // alert(error);
            });
        },
        data: function () {
            return {};
        },
        computed: {
            ...mapState([
                // map this.count to store.state.count
                'isLogged', 'address' , 'showModalSign'
            ])

        },
        methods: {
            manual: function() {
              this.$store.state.showModalSign = true;
            },
            collapseContent: function () {
                if($( window ).width() < 990){
                    $('#navbarSupportedContent').collapse("toggle");
                }

            },
            login: function () {
                this.loadingLogin();
                authService.signSplash(data => {
                    this.$store.dispatch({
                        type: 'login',
                        address: data,
                    });
                    this.collapseContent();
                    this.$router.push('/dashboard');
                }, error => {
                    this.stopLogin();
                    alert(error);
                });
            },
            logout: function () {
                authService.logout(() => {
                    this.logoutVuex();
                    this.collapseContent();
                    this.$router.push('/');
                }, error => {
                    alert(error);
                });
            }, ...mapMutations({
                loginVuex: 'login',
                loadingLogin: 'loadingLogin',
                stopLogin: 'stopLogin',
                logoutVuex: 'logout'
            })
        }
    }
    ;
</script>

<style lang="scss" scoped>
    .bar {
        vertical-align: top;
        height: 5px;
        background: #295087; /* Old browsers */
        background: -moz-linear-gradient(
                        left,
                        #295087 0%,
                        #3f7989 50%,
                        #6aba82 77%,
                        #85c568 100%
        );
        background: -webkit-linear-gradient(
                        left,
                        #295087 0%,
                        #3f7989 50%,
                        #6aba82 77%,
                        #85c568 100%
        );
        background: linear-gradient(
                        to right,
                        #295087 0%,
                        #3f7989 50%,
                        #6aba82 77%,
                        #85c568 100%
        );
        filter: progid:DXImageTransform.Microsoft.gradient(
                        startColorstr="#295087",
                        endColorstr="#85c568",
                        GradientType=1
        );
    }

    .header {
        background-color: #040f1e;

    }

    .head {
        z-index: 999;
        position: fixed;
        width: 100%;
    }

    @media (min-width: 992px) {
        .header {
            height: 12vh;
        }
    }
</style>

<template>
  <div class="head">
    <notifications group="auth" position="bottom right"/>
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
          <!-- <li class="nav-item mx-lg-4" v-if="showshopping" v-on:click="collapseContent()">
            <router-link tag="a" class="nav-link" :active-class="'active'" to="/products" exact>Products
            </router-link>
          </li> -->
          <li class="nav-item mx-lg-4" v-on:click="collapseContent()">
            <router-link tag="a" class="nav-link" :active-class="'active'" to="/intel" exact>Intel
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
              <i class="fa fa-user mr-1">&nbsp;</i>
              <span v-if="address">
                                {{address.slice(0,10) + '...'}}
                            </span>
              <span v-else>SIGN IN</span>
            </a>
            <div class="dropdown-menu dropdown-menu-right" style="font-size: 11px"
                 aria-labelledby="navbarDropdown">
              <a v-if="address" class="dropdown-item" href="#"><a style="color: black;"
                                                                  v-bind:href="etherscan+'/address/'+address"
                                                                  target="_blank">{{address}} <i
                  class="fa fa-external-link-alt"></i></a></a>
              <a v-else class="dropdown-item disabled" href="#">No user AUTHENTICATED</a>
              <a v-if="!isLogged" class="dropdown-item" href="#" v-on:click="login()">MetaMask</a>
              <a v-if="!isLogged" class="dropdown-item" href="#" v-on:click="manual()">Manually</a>
              <!-- <a v-if="!isLogged" class="dropdown-item" href="#" @click="ledgerNanoLogin">Ledger Nano</a> -->

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
  import 'jquery';
  import authService from '../services/authService';
  import DashboardService from '../services/dashboardService';
  import errorService from '../services/errorService';
  import ModalLedgerNano from "./Modals/VModalLedgerNano";
  import VProductsCart from "./VProductsCart"
  import ProductService from '.././services/productService'


  export default {
    name: 'Navbar',
    components: {ModalLedgerNano, VProductsCart},
    mounted: function () {
      this.colorNav = $('#gradient');

      DashboardService.getAddress(res => {
        this.setLastApprovedAddress(res.approved);
        this.$store.dispatch({
          type: 'login',
          address: {address: res},
        });
      }, () => {}, true);
      ProductService.showShopping(res => {
          this.$store.dispatch('handleshowshopping', (res.data.showshoppingcart === "true"))
      });
    },
    watch: {
      loadingNav(value) {
        if (value) {
          $('#gradient').removeClass("animateBar").removeClass("animationEnd");
          setTimeout(() => {
            $('#gradient').addClass('animateBar');
          }, 1);
        } else {
          $('#gradient').removeClass("animateBar");
          setTimeout(() => {
            $('#gradient').addClass('animationEnd');
          }, 1);
        }
      },
      address: function (old, newVal) {
      }
    },
    data: function () {
      return {
        etherscan: window.localStorage.getItem('etherscan'),
        loading: false,
        finish: false,
        colorNav: {}
      };
    },
    computed: {
      ...mapState([
        // map this.count to store.state.count
        'isLogged', 'address', 'showModalSign', 'showshopping'
      ]),
      loadingNav() {
        return this.$store.state.makingRequest;
      },
      logged() {
        return this.$store.state.isLogged;
      }
    },
    methods: {
      manual: function () {
        this.$store.state.showModalSign = true;
      },
      collapseContent: function () {
        if ($(window).width() < 990) {
          $('#navbarSupportedContent').collapse('toggle');
        }
      },
      login: function () {
        this.loadingLogin();
        authService.signSplash(data => {
          this.$router.push('/intel');
          this.$router.go();
          this.collapseContent();
          authService.postSign(
            res => {
              this.$store.dispatch({
                type: 'login',
                address: {address: res.address, dataSign: {signType: 'Metamask', pathId: ''}},
              });
            },
          );
        }, error => {
          this.stopLogin();
          let errorText = error.message ? error.message : error;

          this.$notify({
            group: 'notification',
            type: 'error',
            duration: 10000,
            title: 'Login',
            text: errorService.sendErrorMessage('f1', errorText)
          });
        });
      },
      logout: function () {
        authService.logout(() => {
          this.logoutVuex();
          this.collapseContent();
          this.$router.push('/');
          this.$router.go();
        }, error => {
          let errorText = error.message ? error.message : error;
          this.$notify({
            group: 'notification',
            type: 'error',
            duration: 10000,
            title: 'Logout',
            text: errorText
          });
        });
      },
      ledgerNanoLogin() {
        this.$store.state.showModalLedgerNano = true;
      }
      , ...mapMutations({
        loginVuex: 'login',
        loadingLogin: 'loadingLogin',
        stopLogin: 'stopLogin',
        logoutVuex: 'logout',
        setLastApprovedAddress: 'setLastApprovedAddress'
      })
    }
  }
  ;
</script>

<style lang="scss" scoped>
  .bar {
    vertical-align: top;
    height: 5px;
    background: linear-gradient(8deg, #295087, #3f7989, #6aba82, #85c568, #9ff677);
  }

  .animateBar {
    background: linear-gradient(8deg, #3f7989, #6aba82, #85c568);
    background-size: 1000% 1000%;
    -webkit-animation: AnimationName 10s ease infinite;
    -moz-animation: AnimationName 10s ease infinite;
    animation: AnimationName 10s ease infinite;
  }

  .animationEnd {
    background: linear-gradient(8deg, #295087, #3f7989, #6aba82, #85c568, #9ff677);
    background-size: 1000% 1000%;
    -webkit-animation: AnimationName 2s ease;
    -moz-animation: AnimationName 2s ease;
    animation: AnimationName 2s ease;
  }

  @-webkit-keyframes AnimationName {
    0% {
      background-position: 30% 0%
    }
    50% {
      background-position: 71% 100%
    }
    100% {
      background-position: 30% 0%
    }
  }

  @-moz-keyframes AnimationName {
    0% {
      background-position: 30% 0%
    }
    50% {
      background-position: 71% 100%
    }
    100% {
      background-position: 30% 0%
    }
  }

  @keyframes AnimationName {
    0% {
      background-position: 30% 0%
    }
    50% {
      background-position: 71% 100%
    }
    100% {
      background-position: 30% 0%
    }
  }

  .header {
    background-color: #040f1e;

  }

  @media (max-width: 991px) {
    .header {
      top: 5px;
    }
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

<template>
  <div class="main">
    <notifications group="auth" position="bottom right"/>
    <!--<header class="offer mb-5" style="height:100%;">-->
    <!--<div class="content" style="height:100%; display: flex; align-items: flex-end;">-->
    <!--<div class="overlay"></div>-->
    <!--<div>-->
    <!--<video :src="video.src" loop muted autoplay playsinline>-->
    <!--<img src="../assets/images/overlay.png" title="">-->
    <!--</video>-->
    <!--</div>-->

    <!--<div class="wrapper d-flex align-items-center p-5">-->
    <!--<div class="row middle-xs">-->
    <!--<div class="col-xs-12 col-sm-12 col-md-6">-->
    <!--<div class="site-moto">-->
    <!--<img src="../assets/images/LogoReverse.svg" style="width: 400px; max-width: 100%;"-->
    <!--malt="">-->
    <!--<h1 class="font-body text-left">Current, reputable &-->
    <!--actionable intel for traders and investors.&lt;!&ndash;<br/><br/> <h6>Event driven, alternative data source for capturing alpha.</h6> &ndash;&gt;</h1>-->
    <!--</div>-->
    <!--</div>-->
    <!--<div class="col-xs-12 col-sm-12 col-md-6">-->
    <!--<div class="site-moto font-body conditional-center">-->
    <!--&lt;!&ndash; <center>-->
    <!--<div class="video-box">-->
    <!--<iframe style="width: 100%; height: 100%;" src="https://www.youtube.com/embed/j6MFoSQkT7U?rel=0&amp;showinfo=0" frameborder="0" allowfullscreen></iframe>-->
    <!--</div>-->

    <!--</center>-->
    <!--&ndash;&gt;-->

    <!--<div class="font-body"><h2 style="font-size: 20px;">Connect your<br/><i>PARETO Score&trade;</i> to<br/><b>Post, Trade,-->
    <!--& Earn.</b></h2></div>-->
    <!--<br/>-->

    <!--&lt;!&ndash;<button class="button button&#45;&#45;transparent button&#45;&#45;login"&ndash;&gt;-->
    <!--&lt;!&ndash;style="font-size: 18px; background-color:rgb(107, 194, 123); width:200px;"&ndash;&gt;-->
    <!--&lt;!&ndash;v-on:click="authLogin()"><b v-if="!makingLogin">Access</b> <span v-else&ndash;&gt;-->
    <!--&lt;!&ndash;class="fa fa-spinner fa-spin"></span>&ndash;&gt;-->
    <!--&lt;!&ndash;</button>&ndash;&gt;-->
    <!--<button class="button button&#45;&#45;transparent button&#45;&#45;login"-->
    <!--style="font-size: 18px; background-color:rgb(107, 194, 123); width:200px;"-->
    <!--v-on:click="showModal"><b v-if="!makingLogin">Access</b> <span v-else-->
    <!--class="fa fa-spinner fa-spin"></span>-->
    <!--</button>-->
    <!--<br/>-->
    <!--<div class="font-body"><h6 style="font-size: 12px;">Requires PARETO Scores&trade;<br/> More information <a-->
    <!--style="text-decoration: underline; font-weight: bold; text-size: 16px; color: white;"-->
    <!--href="https://blog.pareto.network/pareto-scores-your-ticket-to-vip-access-6d9aa92f846b">here.</a>-->
    <!--&lt;!&ndash; Purchase from these <a style="text-decoration: underline; font-weight: bold; text-size: 16px;" href="https://coinmarketcap.com/currencies/pareto-network/#markets">active markets.</a> &ndash;&gt;-->
    <!--</h6></div>-->
    <!--</div>-->

    <!--</div>-->

    <!--</div>-->
    <!--<br/>-->
    <!--<br/>-->
    <!--<br/>-->
    <!--</div>-->
    <!--</div>-->
    <!--<svg id="offer-wave" x="0px" y="0px  " viewBox="0 0 1400 37" style="enable-background:new 0 0 1400 37;     fill: #679ab4-->
    <!--" xml:space="preserve">-->
    <!--<path class="offer-wave" d="M0,0h1400c0,0-332.5,37-570.4,37c-202.6,0-390-7.4-390-7.4S255.8,30.1,194.5,29C98.3,27.3,0,11.7,0,11.7V0z"/>-->
    <!--</svg>-->
    <!--</header>&lt;!&ndash; end offer section &ndash;&gt;-->
    <div class="wrapp pareto-blue-dark" v-on:click="showModalSplash()">
      <div class="blocking-content">
      </div>
      <div class="container-fluid pt-5 px-lg-5">
        <div class="row m-0" style="min-height: 100vh; width: 100%;">
          <div class="col-md-6 col-lg-2 mb-5 mt-2 m-sm-0 p-0 order-2 order-lg-1">
            <VProfile :profileObject="user" :onboardingPicture="onboarding"></VProfile>
            <div class="mt-4">
            </div>
          </div>
          <div class="col-md-6 col-lg-3 px-0 mb-3 order-3 order-lg-2">
            <div class="intel-container">
              <div class="mb-3 mb-md-1 px-1">
                <div class="p-2 pt-4">
                  <div class="text-left title-content p-1">
                    <b>EVENTS</b>
                  </div>
                  <button v-if="false" class="btn btn-success-pareto button-margin">POST
                    NEW INTEL
                  </button>
                </div>
                <div class="row mx-0 text-center text-content">
                  <div class="col-4">
                    EVENT
                  </div>
                  <div class="col-4">
                    AMOUNT
                  </div>
                  <div class="col-4">
                    TX ID
                  </div>
                </div>
                <div class="scrollable p-1" id="mypost">
                  <ul>
                    <li v-bind:id="tx.txHash" class="border-0" v-for="tx in transactions">
                      <VTransaction @click.prevent :transaction="tx"></VTransaction>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-12 mb-md-3 mb-lg-0 col-lg-7 px-1 order-1 order-lg-3">
            <div class="intel-container">
              <div class="px-2 py-4 text-left">
                <b class="title-content">
                  MY INTEL FEED
                </b>
                <div class="row text-content mt-4">
                  <div class="col-4 col-md-4 col-lg-2">
                    CONTRIBUTOR
                  </div>
                  <div class="col-8 col-lg-7">
                    INTEL
                  </div>
                </div>
                <div class="pr-lg-2 scrollable" id="myOnboardingfeed">
                  <ul>
                    <div class="text-left border-0 py-2" v-for="row of content">
                      <VIntelPreview @click.prevent
                                     :user="user"
                                     :intel="row"
                                     :eventRow="false"
                                     :onboardingPicture="onboarding">
                      </VIntelPreview>
                    </div>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <ModalSignIn v-if="showModalSign"></ModalSignIn>
    <LoginOptions v-if="showModalLoginOptions"></LoginOptions>
    <ModalLedgerNano v-if="showModalLedgerNano"></ModalLedgerNano>
    <ModalSplashOnboarding v-if="showModalOnboarding"></ModalSplashOnboarding>
  </div>
</template>

<script>
  /* eslint-disable */
  import VParticles from './VParticles';
  import Auth from '../services/authService';

  import {mapMutations, mapState} from 'vuex';
  import VFab from './VFab';
  import LoginOptions from './Modals/VLoginOptions';
  import ModalSignIn from './VModalManualSigIn';
  import ModalLedgerNano from "./Modals/VModalLedgerNano";
  import ModalSplashOnboarding from "./Modals/VModalSplashOnboarding";

  import VideoMp4 from "../assets/download/Pareto-Introduction.mp4";
  import VideoWebm from "../assets/download/Pareto-Introduction.webm";
  import VideoOgg from "../assets/download/Pareto-Introduction.ogv";

  import {information} from '../utils/onboardingInfo';

  import VProfile from './VProfile';
  import VTransaction from './VTransaction';
  import VIntelPreview from './VIntelPreview';

  export default {
    name: 'SplashDashboard',
    components: {VProfile, VTransaction, VIntelPreview, ModalLedgerNano, LoginOptions, ModalSignIn, ModalSplashOnboarding},
    computed: {
      ...mapState([
        'makingLogin',
        'showModalSign',
        'showModalLoginOptions',
        'showModalLedgerNano',
        'showModalOnboarding']
      )
    },
    data() {
      return {
        loading: false,
        option: '',
        video: {
          src: this.supportsVideoType(),
          type: ''
        }, information: information,
        content: [],
        etherscan: window.localStorage.getItem('etherscan'),
        onboarding: require('../assets/images/random_person.png'),
        transactions: [],
        user: {}
      };
    },
    mounted(){
      this.content = information.content;
      this.transactions = information.transactions;
      this.user = information.user;
    },
    methods: {
      authLogin() {
        this.loadingLogin();
        Auth.signSplash(data => {
          this.loading = false;
          this.$store.dispatch({
            type: 'login',
            address: {address: data, dataSign: {signType: 'Metamask', pathId: ''}},
          });
          this.$router.push('/intel');

        }, error => {
          let errorText = error.message ? error.message : error;
          this.$notify({
            group: 'notification',
            type: 'error',
            duration: 10000,
            title: 'Authentication Error',
            text: errorText
          });
          this.stopLogin();
        });
      },
      showModal() {
        this.$store.state.showModalLoginOptions = true;
      },
      showModalSplash(){
        console.log('oye')
        this.$store.state.showModalOnboarding = true;
      },
      hideModal() {
        this.$refs.loginOptions.hide()
      },
      checkLoginOption(option) {
        //  console.log(option);
      },
      supportsVideoType() {
        let video;

        let formats = {
          ogg: 'video/ogg; codecs="theora"',
          h264: 'video/mp4; codecs="avc1.42E01E"',
          webm: 'video/webm; codecs="vp8, vorbis"',
          vp9: 'video/webm; codecs="vp9"',
          hls: 'application/x-mpegURL; codecs="avc1.42E01E"'
        };

        if (!video) {
          video = document.createElement('video');
        }

        if (video.canPlayType(formats.webm) === "probably" || video.canPlayType(formats.vp9) === "probably") {
          return VideoWebm;
        } else if (video.canPlayType(formats.ogg) === "probably") {
          return VideoOgg;
        } else {
          return VideoMp4;
        }
      }
      , ...mapMutations(
        ['login', 'loadingLogin', 'stopLogin']
      )
    }
  };
</script>

<style lang="scss" scoped>
  .blocking-content{
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    z-index: 99
  }

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
<template>
  <div class="main wrapp pareto-blue-dark">
    <div class="container-fluid position-relative px-lg-5">
      <div class="blocking-content" v-if="!loggedUser" v-on:click="showModalSplash()">
      </div>
      <notifications group="auth" position="bottom right"/>
      <div class="row m-0 pt-4 pt-lg-2" style="width: 100%;">
        <div class="col-md-4 col-lg-5 order-2 order-md-1 order-xl-1 row m-0 p-xl-0">
          <div class="col-12 col-xl-5 my-3 my-md-0">
            <VShimmerUserProfile v-if="!user.address"></VShimmerUserProfile>
            <VProfile v-else :addressProfile="user.address" :profileObject="user" :can-edit="true"
                      :onboardingPicture="onboarding"></VProfile>
          </div>
          <div class="col-12 col-xl-7 px-0">
            <VEventFeed v-if="primalLoad" :user="user" :defaultTransactions="information.transactions"></VEventFeed>
            <VShimmerMyPost v-else></VShimmerMyPost>
          </div>
        </div>
        <div class="col-md-8 col-lg-7 px-1 order-1 order-md-2 order-xl-3">
          <VIntelFeed v-if="primalLoad" :user="user" :updateContent="updateContentVar" :block="block"
                      :defaultContent="information.content" :onboardingPicture="onboarding"></VIntelFeed>
          <VShimmerFeed v-else></VShimmerFeed>
        </div>
      </div>
    </div>
    <ModalSignIn v-if="showModalSign"></ModalSignIn>
    <LoginOptions v-if="showModalLoginOptions"></LoginOptions>
    <ModalLedgerNano v-if="showModalLedgerNano"></ModalLedgerNano>
    <ModalSplashOnboarding v-if="showModalOnboarding && !loggedUser"></ModalSplashOnboarding>
  </div>
</template>

<script>
  import dashboardService from "../services/dashboardService";
  import profileService from "../services/profileService";
  import AuthService from "../services/authService";

  import ICountUp from "vue-countup-v2";

  import VIntelFeed from "../components/VIntelFeed.vue";
  import {mapMutations, mapState, mapActions} from "vuex";
  import environment from "../utils/environment";

  import {countUpMixin} from "../mixins/countUp";

  import VShimmerUserProfile from "../components/Shimmer/IntelDetailView/VShimmerUserProfile";
  import VShimmerMyPost from "../components/Shimmer/IntelView/VShimmerMyPost";
  import VShimmerFeed from "../components/Shimmer/IntelView/VShimmerFeed";

  import VProfile from "../components/VProfile";
  import VEventFeed from "../components/VEventFeed";
  import errorService from "../services/errorService";

  import LoginOptions from '../components/Modals/VLoginOptions';
  import ModalSignIn from '../components/Modals/VModalManualSigIn';
  import ModalLedgerNano from "../components/Modals/VModalLedgerNano";
  import ModalSplashOnboarding from "../components/Modals/VModalSplashOnboarding";

  import {information} from '../utils/onboardingInfo';

  export default {
    name: "VIntel",
    mixins: [countUpMixin],
    components: {
      ICountUp,
      VProfile,
      VIntelFeed,
      VEventFeed,
      VShimmerMyPost,
      VShimmerFeed,
      VShimmerUserProfile,
      ModalLedgerNano,
      LoginOptions,
      ModalSignIn,
      ModalSplashOnboarding
    },
    data: function () {
      return {
        baseURL: environment.baseURL,
        block: 0,
        etherscanUrl: window.localStorage.getItem('etherscan'),
        information: '',
        loading: true,
        loggedUser: false,
        paretoAddress: window.localStorage.getItem('paretoAddress'),
        primalLoad: false,
        onboarding: false,
        tokenAmount: 1,
        updateContentVar: 0,
        user: {
          rank: 0,
          score: 0,
          tokens: 0
        }
      };
    },
    mounted: function () {
      AuthService.auth(() => {
        this.main();
        this.loggedUser = true;
      }, () => {
        this.information = information;
        this.loggedUser = false;
        this.primalLoad = true;

        this.user = information.user;
        this.onboarding = require('../assets/images/random_person.png');
      });
    },
    computed: {
      ...mapState([
        'address',
        'ws',
        'signType',
        'pathId',
        'makingLogin',
        'showModalSign',
        'showModalLoginOptions',
        'showModalLedgerNano',
        'showModalOnboarding']),
    },
    methods: {
      ...mapMutations(["intelEnter", "iniWs"]),
      creatorRoute(address) {
        return '/intel/' + address + '/';
      },
      loadAddress: function () {
        if (!this.user.address) {
          return dashboardService.getAddress(
            res => {
              this.user.address = res;
            },
            error => {
              let errorText = error.message ? error.message : error;
              this.$notify({
                group: 'notification',
                type: 'error',
                duration: 10000,
                title: 'Login',
                text: errorText
              });
            }
          );
        }
      },
      numberToScientificNotation(number) {
        return (number + "").length > 12 ? number.toExponential(5) : number;
      },
      overrideOnMessage() {
        let wsa = this.ws;
        this.ws.onmessage = (data) => {
          try {
            const info = JSON.parse(data.data);
            if (info.data.address) {
              this.user.score = info.data.score;
              this.user.rank = info.data.rank;
              this.user.tokens = info.data.tokens;
              // this.user.block = info.data.block;
              this.block = info.data.block;
            }
            if (info.data.action) {
              switch (info.data.action) {
                case 'updateContent': {
                  this.updateContentVar++;
                }
              }
            }
          } catch (e) {
            errorService.sendErrorMessage('f32', e);
            console.log(e);
          }
        };
      },
      socketConnection() {
        let params = {rank: this.rank, limit: 100, page: this.page};
        if (!this.ws) {
          this.iniWs();
          let wss = this.ws;
          this.ws.onopen = function open() {
            wss.send(JSON.stringify(params));
          };
        }
        this.overrideOnMessage();
      },
      loadProfile: function () {
        return profileService.getProfile(
          res => {
            this.user = res;
          },
          error => {
            console.log('Could not retrieve profile')
          }
        );
      },
      showModal() {
        this.$store.state.showModalLoginOptions = true;
      },
      showModalSplash() {
        this.$store.state.showModalOnboarding = true;
      },
      hideModal() {
        this.$refs.loginOptions.hide()
      },
      requestCall: function () {
        Promise.all([
          this.loadProfile()
        ]).then(values => {
          this.$store.state.makingRequest = false;
        });
      },
      main: function () {
        profileService.updateConfig(res => {
          this.etherscanUrl = window.localStorage.getItem('etherscan')
        });
        this.$store.state.makingRequest = true;
        if (!this.madeLogin) {
          this.intelEnter();
          AuthService.postSign(
            (res) => {
              this.primalLoad = true;
              this.requestCall();
            },
            () => {
              this.primalLoad = true;
              this.socketConnection();
              this.requestCall();
            }
          );
        } else {
          this.primalLoad = true;
          this.socketConnection();
          this.requestCall();
        }
      }
    }
  };
</script>

<style scoped lang="scss">
  .blocking-content {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    z-index: 99
  }
</style>
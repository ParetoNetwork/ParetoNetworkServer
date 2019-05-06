<template>
    <div class="main wrapp pareto-blue-dark">
        <div class="container-fluid position-relative px-lg-5">
            <div class="blocking-content" v-if="!loggedUser" v-on:click="showModalSplash()">
            </div>
            <notifications group="auth" position="bottom right"/>
            <div class="row m-0 pt-5 pt-lg-2" style="width: 100%;">
                <div class="col-md-3 col-lg-2 order-2 order-md-1 order-xl-1 row m-0 p-xl-0">
                    <div class="col-12 my-3 my-md-0">
                        <VShimmerUserProfile v-if="!user.address"></VShimmerUserProfile>
                        <VProfile v-else :addressProfile="user.address" :profileObject="user" :can-edit="true"
                                  :onboardingPicture="onboarding"></VProfile>
                    </div>
                    <div class="col-12 px-0">
                        <VEventFeed v-if="primalLoad" :user="user" :updateHash="updateHash"
                                    :defaultTransactions="information.transactions" :block="block"></VEventFeed>
                        <VShimmerMyPost v-else></VShimmerMyPost>
                    </div>
                </div>
                <div class="col-md-9 col-lg-6 px-2 order-1 order-md-2 order-xl-3">
                    <VIntelFeed v-if="primalLoad" :user="user" :updateContent="updateContentVar" :block="block"
                                :defaultContent="information.content" :onboardingPicture="onboarding"></VIntelFeed>
                    <VShimmerFeed v-else></VShimmerFeed>
                </div>
                <div class="col-md-12 col-lg-4 order-3 px-0 pb-5 d-lg-flex flex-lg-row d-xl-flex flex-xl-column" id="chart-row">
                    <VHandlerSunburstChart v-if="primalLoad" :user="user" :sunburstData="information.content" :loggedUser="loggedUser" class="mb-4"></VHandlerSunburstChart>
                    <VStackedToGroupedBars v-if="primalLoad" :stackedBarData="stackedBarData" class="h-custom align-items-xl-end align-items-lg-center d-flex-md align-items-md-center"></VStackedToGroupedBars>
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
  import dashboardService from '../services/dashboardService';
  import profileService from '../services/profileService';
  import AuthService from '../services/authService';

  import ICountUp from 'vue-countup-v2';

  import VIntelFeed from './VIntelFeed.vue';
  import {mapMutations, mapState} from 'vuex';
  import environment from '../utils/environment';

  import {countUpMixin} from '../mixins/countUp';

  import VShimmerUserProfile from './Shimmer/IntelDetailView/VShimmerUserProfile';
  import VShimmerMyPost from './Shimmer/IntelView/VShimmerMyPost';
  import VShimmerFeed from './Shimmer/IntelView/VShimmerFeed';

  import VProfile from './VProfile';
  import VEventFeed from './VEventFeed';
  import errorService from '../services/errorService';

  import LoginOptions from './Modals/VLoginOptions';
  import ModalSignIn from './VModalManualSigIn';
  import ModalLedgerNano from './Modals/VModalLedgerNano';
  import ModalSplashOnboarding from './Modals/VModalSplashOnboarding';

  import {information, stackedBarData} from '../utils/onboardingInfo';

  import VStackedToGroupedBars from './VStackedToGroupedBars';

  import VFab from './VFab';
  import VHandlerSunburstChart from "./VHandlerSunburstChart";


  export default {
    name: 'VIntel',
    mixins: [countUpMixin],
    components: {
      VHandlerSunburstChart,
      VStackedToGroupedBars,
      ICountUp,
      VFab,
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
        sunburstData: '',
        stackedBarData: '',
        loading: true,
        loggedUser: false,
        paretoAddress: window.localStorage.getItem('paretoAddress'),
        primalLoad: false,
        onboarding: false,
        tokenAmount: 1,
        updateContentVar: 0,
        updateHash: 0,
        user: {
          rank: 0,
          score: 0,
          tokens: 0
        }
      };
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
        'showModalOnboarding'])
    },
    mounted: function () {
      this.stackedBarData = stackedBarData;
      AuthService.auth(() => {
        this.main();
        this.loggedUser = true;
      }, () => {
        // The user is not logged, so component loads the predefined information for the onboarding
        this.information = information;
        this.loggedUser = false;
        this.primalLoad = true;
        this.user = information.user;
      });
    },
    methods: {
      ...mapMutations(['intelEnter', 'iniWs']),
      creatorRoute(address) {
        return '/intel/' + address + '/';
      },
      numberToScientificNotation(number) {
        return (number + '').length > 12 ? number.toExponential(5) : number;
      },
      overrideOnMessage() {
        this.ws.onmessage = (data) => {
          try {
            const info = JSON.parse(data.data);

            if (info.data.address) {
              this.user.score = info.data.score;
              this.user.rank = info.data.rank;
              this.user.tokens = info.data.tokens;
              //this.user.block = info.data.block;
              this.block = info.data.block;
            }

            if (info.data.action) {
              switch (info.data.action) {
                case 'updateContent':
                  this.updateContentVar++;
                  break;
                case 'updateHash' :
                  if (info.data.data.event === 'reward') {
                    this.user.rankUpdated = true;
                  }
                  this.updateHash++;
                  break;
              }
            }
          } catch (e) {
            errorService.sendErrorMessage('f32', e);
            console.log(e);
          }
        };
      },
      socketConnection() {
        let params = {rank: this.user.rank, limit: 100, page: this.user.page};
        if (!this.ws) {
          this.iniWs();
          this.ws.onopen = () => {
            this.ws.send(JSON.stringify(params));
          };
        }
        this.overrideOnMessage();
      },
      loadProfile: function () {
        return profileService.getProfile(
          res => {
            this.user = res;
            this.block = res.block;
          },
          error => {
            console.log('Could not retrieve profile');
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
        this.$refs.loginOptions.hide();
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
          this.etherscanUrl = window.localStorage.getItem('etherscan');
        });
        this.$store.state.makingRequest = true;
        if (!this.madeLogin) {
          this.intelEnter();
          AuthService.postSign(
            (res) => {
              this.primalLoad = true;
              this.socketConnection();
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

    @media (min-width: 1200px) {
        .h-custom {
            height: 30% !important;
        }
    }


</style>

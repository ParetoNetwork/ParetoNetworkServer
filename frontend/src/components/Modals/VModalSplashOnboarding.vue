<template>
  <div class="onboarding-modal">
    <b-modal
        @hidden="cancelClick"
        ref="modalOnboarding"
        centered
        hide-header
        hide-footer
        size="lg"
        body-class="modal-onboarding"
        :body-bg-variant="'dark'">

      <div class="row h-100 position-relative p-3">
        <div class="col-lg-7 col-md-6 order-lg-2 intel-container">
          <div class="d-flex justify-content-center h-100">
            <div class="d-flex flex-column justify-content-around">
              <div></div>
              <img v-responsive="['hidden-all','xs','sm']" src="../../assets/images/LogoReverse.svg" width="200px" style="margin: 0 auto" alt="">
              <div class="p-5 text-left">
                <h1 class="mb-3 title-content" style="font-size: 30px"><b>Post. Trade. Earn.</b></h1>
                <p class="subtitle-user-content">
                  The first true peer-to-peer intel marketplace.<br/>Sign in or Purchase access today.
                </p>
              </div>
              <button class="btn btn-dark-primary-pareto button--login mx-auto"
                      style="font-size: 18px; max-width: 80%"
                      @click="showModal"><b v-if="!makingLogin">Access</b> <span v-else
                                                                                 class="fa fa-spinner fa-spin"></span>
              </button>
            </div>
          </div>
        </div>
        <div v-responsive="['hidden-xs', 'hidden-sm']" class="col-lg-5 col-md-6 order-lg-1">
          <div class="d-flex justify-content-center h-100 h-50-ns pareto-bg-dark">
            <div class="d-flex flex-column justify-content-around col-lg-10 col-md-auto col-sm-10 p-5">
              <div class="d-none d-md-block"></div>
              <img src="../../assets/images/LogoReverse.svg" width="200px" style="margin: 0 auto" alt="">
              <p class="p-3 d-none d-md-block subtitle-user-content">Current, reputable & actionable intel for traders and investors.</p>
            </div>
          </div>
        </div>
      </div>
    </b-modal>
  </div>
</template>

<script>
  import Navbar from '../Navbar';
  import VProfile from '../VProfile';
  import VTransaction from '../VTransaction';
  import VIntelPreview from '../VIntelPreview';

  import {mapMutations, mapState} from 'vuex';

  import LoginOptions from './VLoginOptions';
  import ModalSignIn from './VModalManualSigIn';
  import ModalLedgerNano from "./VModalLedgerNano";

  import {information} from '../../utils/onboardingInfo';

  export default {
    computed: {
      ...mapState([
        'makingLogin',
        'showModalSign',
        'showModalLoginOptions',
        'showModalLedgerNano',
        'showModalOnboarding']
      )
    },
    components: {Navbar, VProfile, VTransaction, VIntelPreview, ModalLedgerNano, LoginOptions, ModalSignIn},
    name: 'VModalSplashOnboarding',
    data() {
      return {
        information: information,
        content: [],
        etherscan: window.localStorage.getItem('etherscan'),
        onboarding: require('../../assets/images/user_placeholder.png'),
        transactions: [],
        user: {}
      }
    },
    mounted() {
      this.$refs.modalOnboarding.show();
      this.content = information.content;
      this.transactions = information.transactions;
      this.user = information.user;
    },
    methods: {
      ...mapMutations(
        ['login', 'loadingLogin', 'stopLogin']
      ),
      cancelClick() {
        this.$refs.modalOnboarding.show();
        this.$store.state.showModalOnboarding = false;
      },
      showModal() {
        this.$store.state.showModalOnboarding = false;
        this.$store.state.showModalLoginOptions = true;
      }
    }
  }
</script>
<style>

  .modal-dialog {
    padding: 30px;
  }

  .onboarding-modal .modal-content {
    height: 80vh;
  }

  .onboarding-modal .modal-body {
    padding: 0;
  }

  .modal-onboarding {
    height: 65vh;
  }

  @media (min-width: 500px) {
    .onboarding-modal .modal-content {
      max-width: 1000px;
      max-height: 600px;
    }
  }

</style>
<template>
  <div class="onboarding-modal">
    <b-modal
        @hidden="cancelClick"
        ref="modalOnboarding"
        centered
        hide-header
        hide-footer
        size="lg"
        :body-bg-variant="'dark'">

      <div class="row h-100 position-relative">
        <div class="col-lg-7 order-lg-2 px-0 intel-container">
          <div class="d-flex justify-content-center h-100">
            <div class="d-flex flex-column justify-content-around">
              <div></div>
              <div class="p-5 text-left">
                <h1 class="mb-3 title-content" style="font-size: 30px"><b>Post. Trade. Earn.</b></h1>
                <p>
                  The first true peer-to-peer intel marketplace. Purchase access today.
                </p>
              </div>
              <button class="btn btn-dark-primary-pareto button--login mx-auto"
                      style="font-size: 18px; width: 400px; max-width: 80%"
                      @click="showModal"><b v-if="!makingLogin">Access</b> <span v-else
                                                                                 class="fa fa-spinner fa-spin"></span>
              </button>
              <button class="btn btn-dark-secondary-pareto button--login mx-auto"
                      style="font-size: 18px; width: 400px; max-width: 80%"
                      @click="purchasePriorityAccess"><b v-if="!makingLogin">Buy Priority Access</b>
              </button>
            </div>
          </div>
        </div>
        <div class="col-lg-5 order-lg-1">
          <div class="d-flex justify-content-center h-100">
            <div class="d-flex flex-column justify-content-around">
              <div class="d-none d-md-block"></div>
              <img src="../../assets/images/LogoReverse.svg" width="200px" style="margin: 0 auto" alt="">
              <p class="p-3 d-none d-md-block">Current, reputable & actionable intel for traders and investors.</p>
            </div>
          </div>
        </div>
        <span class="cursor-pointer" @click="cancelClick()">
        <i class="fa fa-window-close fa-2x"
           style="position: absolute; right: 0; top: 0;"></i>
      </span>
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
        ['login', 'loadingLogin', 'stopLogin', 'openCloseModal']
      ),
      cancelClick() {
        this.$refs.modalOnboarding.show();
        this.$store.state.showModalOnboarding = false;
      },
      showModal() {
        this.$store.state.showModalOnboarding = false;
        this.$store.state.showModalLoginOptions = true;
      },
      purchasePriorityAccess(){
        this.$router.push(`purchase`);
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

  @media (min-width: 500px) {
    .onboarding-modal .modal-content {
      max-width: 1000px;
      max-height: 600px;
    }
  }

</style>
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

      <b-container>
        <div class="position-relative">
          <div class="row m-0" style="width: 100%">
            <div class="col-md-6 col-lg-5 my-5">
              <div class="mt-4">
                <img src="../../assets/images/LogoReverse.svg" width="200px" class="my-5" alt="">
                <p class="my-5 p-3">Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum
                  has
                  been the industry's standard dummy text </p>
              </div>
            </div>
            <div class="col-md-6 col-lg-7 px-0 intel-container">
              <div class="d-flex justify-content-center h-100">
                <div class="d-flex flex-column justify-content-around px-5 py-3">
                  <div></div>
                  <div class="px-5 py-4 text-left">
                    <h1 class="mb-3"><b>Title Goes Here </b></h1>
                    <p>
                      Lorem psum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the
                      industry's standard lorem dummy text Ipsum is simply
                      text of the printing and typesetting orgyd dummy text aorem Ipsum is simply dummy text of the
                      printing
                      and typesetting industry.
                      Lorem Ipsum has been the industry's standard dummy text
                    </p>
                  </div>
                  <button class="btn btn-dark-primary-pareto button--login mx-auto"
                          style="font-size: 18px; width: 400px; max-width: 80%"
                          @click="showModal"><b v-if="!makingLogin">Access</b> <span v-else
                                                                                     class="fa fa-spinner fa-spin"></span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <span class="cursor-pointer" @click="cancelClick()">
            <i class="fa fa-window-close fa-2x"
               style="position: absolute; right: 0; top: 0;"></i>
          </span>
        </div>
      </b-container>
    </b-modal>
  </div>
</template>

<script>
  import Navbar from '../Navbar';
  import VProfile from '../VProfile';
  import VTransaction from '../VTransaction';
  import VIntelPreview from '../VIntelPreview';
  import randomPerson from '../../assets/images/random_person.png';

  import {mapMutations, mapState} from 'vuex';

  import LoginOptions from './VLoginOptions';
  import ModalSignIn from '../VModalManualSigIn';
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
        onboarding: require('../../assets/images/random_person.png'),
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
  .onboarding-modal .modal-body, .onboarding-modal .container {
    padding: 0;
  }
</style>
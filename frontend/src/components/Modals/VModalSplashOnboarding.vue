<template>
  <b-modal
      ref="modalOnboarding"
      centered
      hide-header
      hide-footer
      size="lg"
      :body-bg-variant="'dark'">

    <b-container @click.prevent>
      <span class="cursor-pointer" @click="cancelClick()">
        <i class="fa fa-window-close fa-2x"
         style="position: absolute; right: 0; top: 0;"></i>
      </span>
      <nav class="navbar navbar-expand-lg navbar-dark font-weight-bold font-body text-white">
        <router-link tag="a" class="navbar-brand" to="/"><img
            src="../../assets/images/LogoReverse.svg"
            width="150"
            class="d-inline-block align-top"
            alt=""></router-link>
        <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent"
                aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse justify-content-lg-end" id="navbarSupportedContent">
          <ul class="navbar-nav ">
            <li class="nav-item mx-lg-4">
              <router-link tag="a" class="nav-link" :active-class="'active'" to="/intel" exact>Intel
              </router-link>
            </li>
            <li class="nav-item mx-lg-4">
              <router-link tag="a" class="nav-link" :active-class="'active'" to="/leaderboards">Leaderboards
              </router-link>
            </li>
            <li class="nav-item mx-lg-4">
              <router-link tag="a" class="nav-link" :active-class="'active'" to="/about">About</router-link>
            </li>
            <li class="nav-item dropdown mx-lg-4 active">
              <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button"
                 data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <i class="fa fa-user mr-1">&nbsp;</i>
                <span>SIGN IN</span>
              </a>
              <div class="dropdown-menu dropdown-menu-right" style="font-size: 11px"
                   aria-labelledby="navbarDropdown">
                <a v-if="user.address" class="dropdown-item" href="#"><a style="color: black;" v-bind:href="etherscan+'/address/'+user.address" target="_blank">{{user.address}} <i class="fa fa-external-link-alt"></i></a></a>
                <a class="dropdown-item" href="#">Logout</a>
              </div>
            </li>
          </ul>
        </div>
      </nav>
      <div class="row m-0" style="width: 100%" @click.prevent>
        <div class="col-md-6 col-lg-2 mb-5 mt-2 m-sm-0 p-0 order-2 order-lg-1">
          <VProfile :profileObject="user" :onboardingPicture="onboarding"></VProfile>
          <div class="mt-4">
          </div>
        </div>
        <div class="col-md-6 col-lg-2 px-0 mb-3 order-3 order-lg-2">
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
                    <VTransaction :transaction="tx"></VTransaction>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-12 mb-md-3 mb-lg-0 col-lg-8 px-1 order-1 order-lg-3">
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
              <div class="pr-lg-2" id="myOnboardingfeed">
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
      <button class="button button--transparent button--login"
              style="font-size: 18px; background-color:rgb(107, 194, 123); width:200px; float: right"
              @click="showModal"><b v-if="!makingLogin">Access</b> <span v-else
                                                                         class="fa fa-spinner fa-spin"></span>
      </button>
    </b-container>
  </b-modal>
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
    computed: {...mapState([
        'makingLogin',
        'showModalSign',
        'showModalLoginOptions',
        'showModalLedgerNano']
      )},
    components: {Navbar, VProfile, VTransaction, VIntelPreview, ModalLedgerNano, LoginOptions, ModalSignIn},
    name: 'VModalSplashOnboarding',
    data(){
      return {
        information: information,
        content: [
        ],
        etherscan: window.localStorage.getItem('etherscan'),
        onboarding: require('../../assets/images/random_person.png'),
        transactions: [
          {status: 2, event: 'create', amount: '5000', txHash: '0xFETYIGUJS', clicked: true},
          {status: 3, event: 'create', amount: '5000', txHash: '0xFETYIGUJS'},
          {status: 3, event: 'create', amount: '5000', txHash: '0xFETYIGUJS'},
          {status: 3, event: 'create', amount: '5000', txHash: '0xFETYIGUJS'},
          {status: 3, event: 'create', amount: '5000', txHash: '0xFETYIGUJS'},
          {status: 3, event: 'create', amount: '5000', txHash: '0xFETYIGUJS'},
          {status: 3, event: 'create', amount: '5000', txHash: '0xFETYIGUJS'}
        ],
        user: {
          address: '0xcceba5addf6504d257c4f55aeb8c329c2e88c080',
          alias: 'Michael Smith',
          biography: 'Market-Proven AI and ML Trading Specialist',
          rank: 107,
          score: 881345,
          tokens: 50000,
          aliasSlug: '',
          profilePic: 'random_person'
        },
      }
    },
    mounted(){
      this.$refs.modalOnboarding.show();
      this.content = information.content;
      this.transactions = information.transactions;
      this.user = information.user;
    },
    methods: {
      ...mapMutations(
        ['login', 'loadingLogin', 'stopLogin']
      ),
      cancelClick(){
        this.$refs.modalOnboarding.hide();
      },
      showModal () {
        this.$store.state.showModalLoginOptions = true;
      }
    }
  }
</script>
<style>
</style>
<template>
  <b-modal
      ref="modalOnboarding"
      centered
      hide-header
      hide-footer
      size="lg"
      :body-bg-variant="'dark'">

    <b-container @click.prevent>
      <div class="mr-5">
        <Navbar class="mr-5"></Navbar>

      </div>
      <div class="row m-0" style="width: 100%; padding-top: 105px" @click.prevent>
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
              <div class="pr-lg-2" id="myfeed">
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
    </b-container>
  </b-modal>
</template>

<script>
  import Navbar from '../Navbar';
  import VProfile from '../VProfile';
  import VTransaction from '../VTransaction';
  import VIntelPreview from '../VIntelPreview';
  import randomPerson from '../../assets/images/random_person.png';

  export default {
    components: {Navbar, VProfile, VTransaction, VIntelPreview},
    name: 'VModalSplashOnboarding',
    data(){
      return {
        content: [
        ],
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

      for(let i=0; i<3; i++){
        this.content.push(
          {
            title: 'TLRY short inminent, 10 days to cover, 50% move',
            dateCreated: new Date(),
            txHash: '0xFETYIGUJS',
            block: 10000,
            blockAgo: '5769',
            createdBy: this.user,
            intelAddress: '0xFETYIGUJS',
            address: '0xcceba5addf6504d257c4f55aeb8c329c2e88c080',
            expires: new Date(),
            reward: 1000
          }
        );
      }
    },
    methods: {
      cancelClick(){
        console.log('nope');
      }
    }
  }
</script>
<style>
</style>
<template>
  <div class="intel-container">
    <div v-if="!loading" class="p-2 pt-1 text-left">
      <div class="row align-items-center">
        <div v-responsive="['hidden-xs', 'hidden-sm']" class="col-3">
          <b class="title-content">
            Intel Market
          </b>
        </div>
        <div v-responsive.sm.xs class="col-2">
          <b class="title-content">
            Intel
          </b>
        </div>
        <div class="col-8">
          <VDelay :intelDelay="myFeed.intel[0].contentDelay" :select="1" class="d-flex flex-row align-items-end"></VDelay>
        </div>
        <div class="col-1" @click="openModalInfoIntelClick()">
          <i class="fas fa-question-circle"></i>
        </div>
      </div>
      <div class="scrollable pr-lg-2" id="myfeed" v-on:scroll="scrollMyFeed()">
        <ul>
          <li class="text-left  py-2" :style="getBorderLeft(row.priority)" :key="row._id"
              v-for="row of myFeed.intel">
            <VIntelPreview :user="user" :intel="row" :eventRow="false"></VIntelPreview>
          </li>
        </ul>
      </div>
    </div>
    <VShimmerFeed v-else></VShimmerFeed>
    <VModalInfo v-if="showModalInfoIntel" :tutorial="tutorials.tutorial.intelmarket"></VModalInfo>
  </div>
</template>

<script>
  import ICountUp from "vue-countup-v2";
  import {countUpMixin} from "../mixins/countUp";
  import moment from "moment";
  import environment from "../utils/environment";

  import {mapState, mapMutations, mapActions} from "vuex";

  import dashboardService from "../services/dashboardService";
  import profileService from "../services/profileService";

  import VShimmerFeed from "./Shimmer/IntelView/VShimmerFeed";

  import VModalInfo from "./Modals/VModalInfo";
  import VIntelPreview from "./VIntelPreview";
  import VDelay from "./VDelay";
  import errorService from "../services/errorService";

  import {tutorials} from '../utils/tutorialInfo';

  export default {
    name: "VIntelFeed",
    components: {
      ICountUp,
      VShimmerFeed,
      VIntelPreview,
      VDelay,
      VModalInfo
    },
    props: [
      'updateIntel', 'block', 'user', 'fetchAddress', 'title', 'defaultIntel', 'onboardingPicture'
    ],
    mixins: [countUpMixin],
    data: function () {
      return {
        allMyIntel: [],
        baseURL: environment.baseURL,
        moment: moment,
        tutorials: {},
        etherscanUrl: window.localStorage.getItem('etherscan'),
        myFeed: {
          intel: [],
          loading: false,
          page: 0,
        },
        loading: true,
        intel: {}
      }
    },
    beforeMount: function () {
      if (this.defaultIntel !== undefined && this.defaultIntel.length > 0){
        this.myFeed.intel = this.defaultIntel;
        this.loading = false;
      } else {
        this.loadIntel({page: 0, limit: 20});
      }
    },
    mounted: function() {
      this.tutorials = tutorials;
    },
    watch: {
      //Updates when parent view, which has the webSocket, receives new information and refreshes
      updateIntel: function (uC) {
        this.updateFeedIntel();
      },
      block: function (block) {
        this.assignBlock(block);
      }
    },
    computed: {
      ...mapState([
        'showModalInfoIntel',
        ])
    },
    methods: {
      ...mapMutations(["openModalInfoIntel", "openModalReward","setFirstIntel"]),
      assignBlock(block) {
        this.myFeed.intel = this.myFeed.intel.map(item => {
          item.blockAgo = block - item.block > 0 ? block - item.block : 0;
          return item;
        });
      },
      loadIntel: function (params) {
        params = params || null;

        let onSuccess = (res) => {
          this.loading = false;
          this.myFeed.page++;
          this.myFeed.loading = false;
          if(res.length > 0) {
            this.myFeed.intel = [...this.myFeed.intel, ...res];
            this.setFirstIntel([].concat(this.myFeed.intel));
          }
        };

        let onError = (error) => {
          this.loading = false;
          let errorText = error.message ? error.message : error;
          this.$notify({
            group: 'notification',
            type: 'error',
            duration: 10000,
            title: 'Intel',
            text: errorText
          });
        };

        if (this.fetchAddress) {
          let params = {
            page: this.myFeed.page,
            limit: 20,
            user: this.fetchAddress
          };
          return dashboardService.getIntelForLoggedInUser(params,
            onSuccess,
            onError
          );
        } else {
          return dashboardService.getAllIntel(params,
            onSuccess,
            onError
          );
        }
      },
      randomNumber: function (min = 1, max = 3) {
        return Math.floor(Math.random() * (max - min + 1) + min);
      },
      scrollMyFeed: function () {
        let list = document.getElementById("myfeed");

        try {
          if (list.scrollTop + list.offsetHeight >= list.scrollHeight * 0.9
            && !this.myFeed.loading && !this.defaultIntel) {
            const params = {limit: 20, page: this.myFeed.page};
            this.myFeed.loading = true;

            this.$store.state.makingRequest = true;

            let myFeedIntelReady = this.loadIntel(params);
            myFeedIntelReady.then(() => {
              this.$store.state.makingRequest = false;
            });
          }
        } catch (e) {
          console.log(e);
        }
      },
      //Calls method when socket information comes in from parent method
      updateFeedIntel: function () {
        let params = {
          page: 0,
          limit: this.myFeed.intel.length,
          user: this.fetchAddress
        };
        return dashboardService.getAllIntel(params, res => {
            res.forEach(intel => {
              let found = false;
              this.myFeed.intel = this.myFeed.intel.map(myFeedIntel => {
                if (intel._id === myFeedIntel._id) {
                  myFeedIntel = intel;
                  found = true;
                }
                return myFeedIntel;
              });
              if (!found) {
                this.myFeed.intel.unshift(intel);
              }
            });
          },
          error => {
            let errorText = error.message ? error.message : error;
            errorService.sendErrorMessage('f8', errorText);
            this.$notify({
              group: 'notification',
              type: 'error',
              duration: 10000,
              title: 'Intel',
              text: errorText
            });
          }
        );
      },
      getBorderLeft(priority) {
          switch(priority){
              case 1:{
                  return {"border-left": "0.5rem solid", "border-left-color": "#c24e4e !important"}
              }
              case 2:{
                  return {"border-left": "0.5rem solid", "border-left-color": "#ca9036 !important"}
              }
              case 3:{
                  return {"border-left": "0.5rem solid", "border-left-color": "#6ac27e !important"}
              }
              case 4:{
                  return {"border-left": "0.5rem solid", "border-left-color": "#294b83 !important"}
              }
          }


          return {};
      },
      openModalInfoIntelClick() {

          this.openModalInfoIntel(true);

      }
    }
  }
</script>

<style scoped>
</style>
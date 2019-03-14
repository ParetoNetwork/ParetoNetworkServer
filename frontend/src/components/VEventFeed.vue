<template>
  <div class="intel-container">
    <VShimmerMyPost v-if="!loadAllContent"></VShimmerMyPost>
    <div v-else class="mb-3 mb-md-1 px-1">
      <div class="pt-4" style="padding-left: 0.5rem;">
        <div class="text-left title-content">
          <b>EVENTS</b>
        </div>
        <button v-if="false" class="btn btn-success-pareto button-margin" @click="goToIntelPage()">POST
          NEW INTEL
        </button>
      </div>
      <!-- <div class="row mx-0 text-center text-content">
        <div class="col-4">
          EVENT
        </div>
        <div class="col-4">
          AMOUNT
        </div>
        <div class="col-4">
          TX ID
        </div>
      </div> -->
      <div class="scrollable p-2" id="mypost" v-on:scroll="scrollMyPost()">
        <ul v-if="transactions.length">
          <li v-bind:id="tx.txHash" class="border-0" v-for="tx in transactions" :key="tx.txHash">
            <VIntelPreview v-if="tx.intelInfo" :user="user" :intel="tx.intelInfo"
                           :eventRow="true"></VIntelPreview>
            <VTransaction v-if="!tx.intelInfo" :transaction="tx"></VTransaction>
          </li>
        </ul>
        <span v-else> No data to display </span>
      </div>
    </div>
  </div>
</template>

<script>
  import {mapState, mapActions, mapMutations} from "vuex";
  import ContentService from "../services/ContentService";
  import dashboardService from "../services/dashboardService";
  import VShimmerMyPost from "./Shimmer/IntelView/VShimmerMyPost";
  import VIntelPreview from "./VIntelPreview";
  import VTransaction from "./VTransaction";
  import {Promise} from "es6-promise";

  export default {
    name: "VEventFeed",
    props: [
      'user', 'defaultTransactions'
    ],
    data: function () {
      return {
        alertTransactions: 0,
        etherscanUrl: window.localStorage.getItem('etherscan'),
        loadedMyContent: false,
        myContent: [],
        allContent: [],
        page: 0,
        limit: 20,
        isLoadingScroll: false,
        transactions: [],
        lastFlashed: '',
        loadAllContent: false
      }
    },
    components: {
      VTransaction,
      VShimmerMyPost,
      VIntelPreview
    },
    computed: {
      ...mapState(["pendingTransactions"]),
    },
    directives: {
      scroll: {
        inserted: function (el, binding) {
          let f = function (evt) {
            if (binding.value(evt, el)) {
              window.removeEventListener('scroll', f)
            }
          };
          window.addEventListener('scroll', f)
        }
      }
    },
    mounted: function () {
      if (this.defaultTransactions !== undefined && this.defaultTransactions.length > 0) {
        this.loadAllContent = true;
        this.transactions = this.defaultTransactions;
      } else {
        this.loadRequest();
      }
    },
    watch: {
      'pendingTransactions': function (newTransactions) {
        newTransactions.forEach((item, index) => {
          if(!this.defaultTransactions){

          }
          let wasFound = false;
          this.transactions.forEach(tx => {
            if (tx.txHash === item.txHash) {
              wasFound = true;
              if (item.status >= tx.status) {
                this.$set(tx, 'status', item.status);
              }
              if (item.status === 3 && item.event === 'create' && !tx.intelInfo) {
                this.updateCreateEvent(tx);
              }
            }
          });
          if (!wasFound) {
            this.transactions.unshift(item)
          }
        });
      },
    },
    methods: {
      ...mapActions(["addTransaction", "transactionComplete", "assignTransactions", "editTransaction"]),
      ...mapMutations(["addDistribute"]),
      //Loads the pendingTransactions state
      getTransactions: function () {
        let params = {q: 'all', page: this.page, limit: this.limit};
        return ContentService.getTransactions(params, data => {
          data = data.filter(item => {
            if (item.event === 'distribute') {
              this.addDistribute(item);
              return false;
            }
            return true;
          });
          this.transactions = [...this.transactions, ...data];
        }, error => {
          let errorText = error.message ? error.message : error;
          this.$notify({
            group: 'notification',
            type: 'error',
            duration: 10000,
            title: 'Login',
            text: errorText
          });
        });
      },
      loadMyContent: function () {
        let params = {page: this.page, limit: this.limit};
        return dashboardService.getContent(params,
          res => {
            this.loadedMyContent = true;
            this.myContent = [...this.myContent, ...res];
          },
          error => {
            let errorText = error.message ? error.message : error;
            this.$notify({
              group: 'notification',
              type: 'Content',
              duration: 10000,
              title: 'Content',
              text: errorText
            });
          }
        );
      },
      loadRequest: function () {
        Promise.all([
          this.getTransactions(),
          this.loadMyContent()
        ]).then(values => {
          this.loadAllContent = true;
          try {
            if (this.limit === 20) {
              this.limit = 10;
              this.page += 2;
            } else {
              this.page += 1;
            }
            this.$store.state.makingRequest = false;
            this.isLoadingScroll = false;

            this.transactions.forEach(tx => {
              if ((tx.event === 'create' || tx.event === 'distribute') && tx.status > 2) {
                this.myContent.forEach(item => {
                  if (item.id == tx.intel) {
                    this.$set(tx, 'intelInfo', item);
                  }
                });
              }

              if (this.pendingTransactions.length === 0 && tx.status < 3) {
                this.addTransaction(tx);
              } else {
                this.pendingTransactions.forEach(item => {
                  if (tx.txHash === item.txHash) {
                    if (item.status >= tx.status) {
                      this.$set(tx, 'status', item.status);
                      this.$set(tx, 'clicked', true);
                    }
                  }
                });
              }
            });
          } catch (e) {
            console.log(e)
          }
        });
      },
      scrollMyPost: function () {
        let list = document.getElementById("mypost");

        if (list.scrollTop + list.offsetHeight + 10 >= list.scrollHeight && !this.isLoadingScroll && !this.defaultTransactions) {
          this.$store.state.makingRequest = true;
          this.isLoadingScroll = true;
          this.loadRequest();
        }
      },
      updateCreateEvent: function (tx) {
        let params = {page: 0, limit: 10};

        return dashboardService.getContent(params,
          res => {
            try {
              let intel = res.find(item => {
                return item.id == tx.intel;
              });
              if (intel) {
                $('#' + tx.txHash).bind("animationend webkitAnimationEnd oAnimationEnd MSAnimationEnd", function () {
                  $(this).removeClass('higher-flash');
                }).addClass('higher-flash');
              }
              this.lastFlashed = tx.txHash;
              this.$set(tx, 'intelInfo', intel);
            } catch (e) {
              console.log(e);
            }
          },
          error => {
          }
        );
      },

    }
  }
</script>

<style scoped>

  @keyframes higher-flash {
    0% {
      background: #6aba82;
    }
    100% {
      background: none;
    }
  }

  .higher-flash {
    animation: higher-flash 3s;
  }
</style>
<template>
    <div class="d-inline-block">
        <button v-if="intel.intelAddress && signType != 'Manual' && intel.expires > Math.round(new Date().getTime() / 1000)"
                class="btn mx-auto px-4"
                :disabled="pendingRowTransactions(intel) || user.address === intel.address"
                v-bind:class="{pulsate: pendingRowTransactions(intel),
                'btn-dark-primary-pareto': !(pendingRowTransactions(intel) || user.address === intel.address),
                'btn-dark-grey-primary-pareto': (pendingRowTransactions(intel) || user.address === intel.address)}"
                @click="openRewardModal()">
            <img src="../../assets/images/LogoMarkDark.png" width="20px" alt="">
            {{ intel.reward }}
        </button>
        <button
                v-if="
                    intel.intelAddress &&
                    signType != 'Manual' &&
                    intel.expires < Math.round(new Date().getTime() / 1000) &&
                    !intel.distributed"
                :disabled="clickedCollect ||  user.address !== intel.address"
                class="btn  mx-auto px-4"
                v-bind:class="{pulsate: clickedCollect,
                  'btn-dark-primary-pareto': user.address === intel.address,
                'btn-dark-grey-primary-pareto':  user.address !== intel.address}"
                @click="distribute(intel)">
            <i v-if="user.address === intel.address" class="fa fa-exchange-alt left"></i>
            <img src="../../assets/images/LogoMarkDark.png" width="20px" alt="">
            {{ intel.reward }}
        </button>
        <a v-if="intel.distributed"
           v-bind:href="etherscanUrl+'/tx/'+ (intel.txHashDistribute || intel.txHash)"
           :disabled="user.address !== intel.address"
           target="_blank">
            <button class="btn cursor-pointer btn-dark-grey-primary-pareto mx-auto px-4">
                <img v-if="user.address === intel.address"  class="left" style="width: 18px;" src="../../assets/images/etherscan.png" alt="">
                <img src="../../assets/images/LogoMarkDark.png" width="20px" alt="">
                {{ intel.reward }}
            </button>
        </a>
    </div>
</template>

<script>
  import {mapMutations, mapState} from 'vuex';
  import ContentService from '../../services/ContentService';
  import VModalReward from '../Modals/VModalReward';

  export default {
    name: 'VIntelButtonAction',
    props: [
      'user', 'intel'
    ],
    components: {
      VModalReward
    },
    data: function () {
      return {
        clickedCollect: false,
        etherscanUrl: window.localStorage.getItem('etherscan')
      };
    },
    computed: {
      ...mapState(['ws', 'signType', 'pendingTransactions', 'currentDistributes'])
    },
    mounted: function () {
    },
    methods: {
      ...mapMutations(['openModalReward', 'addReward', 'addDistribute', 'deleteDistribute']),
      distribute: function (intel) {
        this.clickedCollect = true;

        let foundIntel = this.currentDistributes.find(distribute => {
          return distribute.intel === this.intel.id;
        });

        if (foundIntel) {
          this.$notify({
            group: 'notification',
            type: 'warning',
            duration: 10000,
            text: 'The Intel was already Collected'
          });
          return;
        }

        ContentService.distributeRewards(
          {title: intel.title, ID: intel.id, intelAddress: intel.intelAddress},
          {signType: this.signType, pathId: this.pathId},
          {
            addDistribute: this.addDistribute
          },
          res => {
            this.intel.distributed = true;
            this.$notify({
              group: 'notification',
              type: 'success',
              duration: 10000,
              title: 'Event: Collect',
              text: 'Confirmed Collect'
            });
          },
          err => {
            this.deleteDistribute(intel.id);
            this.clickedCollect = false;
            this.$notify({
              group: 'notification',
              type: 'error',
              duration: 10000,
              text: err.message ? err.message : err
            });
          }
        );
      },
      openRewardModal: function () {
        let params = {
          intel: this.intel,
          tokens: this.user.tokens
        };
        this.addReward(params);
        this.openModalReward(true);
      },
      pendingRowTransactions: function (intel) {
        let transactionPending = false;

        this.pendingTransactions.forEach(tx => {
          if (tx.status < 3 && tx.event === 'reward' && tx.intel === intel.id) {
            transactionPending = true;
          }
        });
        return transactionPending;
      }
    }
  };
</script>

<style scoped>
    .pulsate {
        -webkit-animation: pulsate 3s ease-out;
        -webkit-animation-iteration-count: infinite;
        opacity: 0.5;
    }

    .left {
        margin-right: 5px;
        padding-top: 2px;
        font-size: 16px;

    }

    @-webkit-keyframes pulsate {
        0% {
            opacity: 0.5;
        }
        50% {
            opacity: 1;
        }
        100% {
            opacity: 0.5;
        }
    }
</style>

<template>
  <div class="d-inline-block">
    <button v-if="intel.intelAddress && signType != 'Manual' && intel.expires > Math.round(new Date().getTime() / 1000)"
            class="btn btn-dark-primary-pareto mx-auto px-4"
            :disabled="pendingRowTransactions(intel) || user.address === intel.address"
            @click="openRewardModal()">
      <img src="../../assets/images/LogoMarkDark.png" width="20px" alt="">
      {{ intel.reward }}
    </button>
    <b-btn
        v-if="user.address === intel.address &&
                    intel.intelAddress &&
                    signType != 'Manual' &&
                    intel.expires < Math.round(new Date().getTime() / 1000) &&
                    !intel.distributed"
        :disabled="clickedCollect"
        class="btn-dark-primary-pareto mx-auto px-4"
        @click="distribute(intel)">
      COLLECT
    </b-btn>
    <a v-if="user.address === intel.address && intel.distributed"
       v-bind:href="etherscanUrl+'/tx/'+ (intel.txHashDistribute || intel.txHash)"
       target="_blank">
      <b-btn class="cursor-pointer btn-dark-primary-pareto mx-auto px-4">
        <i class="fa fa-external-link-alt"></i> SENT
      </b-btn>
    </a>
  </div>
</template>

<script>
  import {mapMutations, mapState} from "vuex";
  import ContentService from "../../services/ContentService";
  import VModalReward from "../Modals/VModalReward";

  export default {
    name: "VIntelButtonAction",
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
      ...mapState(["ws", "signType", "pendingTransactions", "currentDistributes"])
    },
    mounted: function () {
    },
    methods: {
      ...mapMutations(["openModalReward", "addReward", "addDistribute", "deleteDistribute"]),
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
            text: "The Intel was already Collected"
          });
          return;
        }

        ContentService.distributeRewards(
          {ID: intel.id, intelAddress: intel.intelAddress},
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
      },
    }
  }
</script>

<style scoped>

</style>
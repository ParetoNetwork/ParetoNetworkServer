<template>
    <div class="d-inline-block">
        <b-btn v-if="intel.intelAddress && signType != 'Manual' && intel.expires > Math.round(new Date().getTime() / 1000)"
               class="btn-primary-pareto mx-auto px-4"
               style="width: 120px;"
               :disabled="pendingRowTransactions(intel) || user.address === intel.address"
               @click="openRewardModal()">
            <img src="../../assets/images/LogoMarkWhite.svg" width="20px" alt="">
            <b> {{ intel.reward }} </b>
        </b-btn>
        <b-btn
                v-if="user.address === intel.address &&
                    intel.intelAddress &&
                    signType != 'Manual' &&
                    intel.expires < Math.round(new Date().getTime() / 1000) &&
                    !intel.distributed"
                class="btn-primary-pareto mx-auto px-4"
                @click="distribute(intel)">
            COLLECT
        </b-btn>
        <a v-if="user.address === intel.address && intel.distributed"
           v-bind:href="etherscanUrl+'/tx/'+ (intel.txHashDistribute || intel.txHash)"
           target="_blank">
            <b-btn class="cursor-pointer btn-primary-pareto mx-auto px-4">
                <i class="fa fa-external-link"></i> SENT
            </b-btn>
        </a>
    </div>
</template>

<script>
    import {mapMutations, mapState, mapActions} from "vuex";
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
                etherscanUrl: window.localStorage.getItem('etherscan')
            };
        },
        computed: {
            ...mapState(["ws", "signType", "pendingTransactions"])
        },
        mounted: function () {
        },
        methods: {
            ...mapMutations(["openModalReward", "addReward"]),
            ...mapActions(["addTransaction", "transactionComplete", "editTransaction"]),
            distribute: function (intel) {

                ContentService.distributeRewards(
                    {ID: intel.id, intelAddress: intel.intelAddress},
                    {signType: this.signType, pathId: this.pathId},
                    {
                        addTransaction: this.addTransaction,
                        transactionComplete: this.transactionComplete,
                        editTransaction: this.editTransaction,
                        toastTransaction: this.$notify
                    },
                    res => {
                        this.modalWaiting = false;
                        this.$notify({
                            group: 'notification',
                            type: 'success',
                            duration: 10000,
                            title: 'Event: Collect',
                            text: 'Confirmed Collect'
                        });
                    },
                    err => {
                        this.modalWaiting = false;
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
                console.log(this.intel, this.user.tokens);
                let params = {
                    intel: this.intel,
                    tokens: this.user.tokens
                };
                this.addReward(params);
                this.openModalReward(true);
            },
            pendingRowTransactions: function (intel) {
                let transactionPending = false;
                this.pendingTransactions.forEach(transaction => {
                    if (intel.id === transaction.intel) {
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
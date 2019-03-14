<template>
    <div class="text-center position-relative">
        <div class="row ml-0 mr-0 py-3 cursor-pointer border-bottom text-content" style="border-bottom-color: black !important;">
            <div class="col-4 px-0 text-left" @click="clickTransaction()" >
                <a v-bind:href="etherscanUrl+'/tx/'+transaction.txHash"
                   target="_blank" class="col-1 px-0 pl-1">
                    <font-awesome-icon v-if="transaction.event === 'create'" :icon="['fas', 'seedling']" :class="statusColor(transaction.status)"></font-awesome-icon>
                    <font-awesome-icon v-else-if="transaction.event === 'reward'" :icon="['fas', 'coins']" :class="statusColor(transaction.status)"></font-awesome-icon>
                    {{transaction.amount}}
                </a>
            </div>
            <div class="col-1 text-left"><font-awesome-icon :icon="['fas', 'arrow-alt-circle-right']" :class="statusColor(transaction.status)"></font-awesome-icon></div>
            <!-- <div class="col-4 px-0 text-left" @click="clickTransaction()" > -->
            <p class="col-6 px-0 pl-1 ellipsis">
            <a v-bind:href="etherscanUrl+'/tx/'+transaction.txHash" target="_blank">
                {{ transaction.intelData.title }}
            </a><!-- use intelData.address / transaction.txHash to pass into IntelDetail view to force it to load this object -->
            </p>
        </div>
    </div>
</template>

<script>
    import ICountUp from "vue-countup-v2";
    import moment from "moment";
    import { mapState, mapActions } from "vuex";

    import {countUpMixin} from "../mixins/countUp";
    import ContentService from "../services/ContentService";

    export default {
        name: "VTransaction",
        props: [
            "transaction" , "creatingLoading"
        ],
        mixins: [countUpMixin],
        components: {
            ICountUp
        },
        data: function () {
            return {
                etherscanUrl: window.localStorage.getItem('etherscan'),
                loadingEffect: {},
                clicked: false
            }
        },
        filters: {
            dateFilter: function formatDate(date) {
                const temp = moment(date);
                return temp.format("MMMM Do, YYYY");
            }
        },
        watch: {
        },
        mounted : function(){
            let newId = this.transaction.txHash + '-span';
            this.clicked = this.transaction.clicked;
            this.loadingEffect = document.getElementById(newId);
        },
        methods: {
            ...mapActions(["addTransaction", "transactionComplete", "assignTransactions", "editTransaction"]),
            clickTransaction: function(){
                if(this.transaction.status >= 3) {

                    let transactionText = 'This transaction was already completed';
                    let title = 'Transaction Completed';
                    let type = 'warning';

                    if(this.transaction.status === 4){
                        transactionText = 'This transaction failed';
                        title = ' Transaction Failed';
                        type = 'error';
                    }

                    this.$notify({
                        group: 'notification',
                        type: type,
                        title: title,
                        duration: 10000,
                        text: transactionText
                    });
                    return;
                }

                if(!this.transaction.clicked) {
                    this.clicked = true;
                    this.$set(this.transaction, 'clicked', true);

                    this.editTransaction({hash: this.transaction.txHash, key: 'clicked', value: 'true'});

                    ContentService.pendingTransactionApproval(
                        this.transaction,
                        {signType: this.signType, pathId: this.pathId},
                        {
                            addTransaction: this.addTransaction,
                            transactionComplete: this.transactionComplete,
                            editTransaction: this.editTransaction,
                            toastTransaction: this.$notify
                        },
                        res => {
                            this.$notify({
                                group: 'notification',
                                type: 'success',
                                duration: 10000,
                                title: 'Event: ' + this.transaction.event,
                                text: 'Confirmed ' + this.transaction.event
                            });
                        },
                        err => {
                            this.$notify({
                                group: 'notification',
                                type: 'error',
                                duration: 10000,
                                text: err.message ? err.message : err
                            });
                        });
                }else{
                    this.$notify({
                        group: 'notification',
                        type: 'warning',
                        title: 'Your transaction is being processed',
                        duration: 10000,
                        text: 'Wait for the process to complete'
                    });
                }
            },
            dateStringFormat(date) {
                return new Date(date);
            },
            statusColor(status){
                let click = this.clicked || this.transaction.clicked;
                return {
                    'red-background' : status == 4 || status < 3 && !click,
                    'green-background' : status == 3,
                    'yellow-background' : status < 3 && click
                };
            }
        }
    }
</script>
<style>

</style>
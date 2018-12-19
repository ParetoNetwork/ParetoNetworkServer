<template>
    <div class="text-left">
        <div class="row p-0 cursor-pointer" @click="clickTransaction()">
            <div class="col-12 col-lg-7 p-0">
                <h1 class="title" v-line-clamp="2">{{transactionStatus(transaction.status)}}
                    <span v-bind:id="transaction.txHash + '-span'"> </span>
                    <i v-if="transaction.status < 3 && !transaction.clicked" class="fa fa-exclamation-circle" style="color: red"></i>
                </h1>
            </div>
            <div class="col-12 col-lg-5 p-0">
                <div class="text-center">
                    <h1> {{transaction.event}} </h1>
                </div>
            </div>
        </div>
        <div class="row border-bottom">
            <div class="col-md col-xs ellipsis text-left">
                <a class="text-primary" :href="etherscanUrl + '/tx/' + (transaction.txRewardHash || transaction.txHash)"
                   target="_blank">
                    <i class="fa fa-th-large" style="color: #000; margin: 5px;"></i>
                    txid: {{transaction.txHash.substring(0,10)}}
                </a>
            </div>
            <div class="col-md col-xs-4 ellipsis" style="text-align: center;">
                <a style="color: #000;"
                   :href="etherscanUrl + '/tx/' + (transaction.txRewardHash || transaction.txHash)"
                   target="_blank">
                    <i class="fa fa-calendar-o" style="color: #000;"></i>&nbsp;
                    <span class="text-dashboard">
                        <b>{{ dateStringFormat(transaction.dateCreated)| moment("from", "now") }}</b>
                    </span>
                </a>
            </div>
            <div class="col-md col-xs">
                <p class="text-right text-secondary ellipsis" style="margin-right: 5px;"><img
                        src="../assets/images/LogoMarkColor.svg" width="20px" alt="">
                    <b> {{transaction.amount}}</b>
                </p>
            </div>
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
                loadingEffect: {}
            }
        },
        filters: {
            dateFilter: function formatDate(date) {
                const temp = moment(date);
                return temp.format("MMMM Do, YYYY");
            }
        },
        watch: {
            'transaction.clicked' : function (valNew, valOld) {
                this.loadingTransaction();
            }
        },
        mounted : function(){
            let newId = this.transaction.txHash + '-span';
            this.loadingEffect = document.getElementById(newId);
            this.loadingTransaction();
        },
        methods: {
            ...mapActions(["addTransaction", "transactionComplete", "assignTransactions", "editTransaction"]),
            clickTransaction: function(){
                if(this.transaction.status >= 3) {
                    this.$notify({
                        group: 'notification',
                        type: 'warning',
                        title: 'Transaction Completed',
                        duration: 10000,
                        text: 'This transaction was already completed'
                    });
                    return;
                }

                if(!this.transaction.clicked) {
                    this.loadingTransaction();

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
                            console.log(res);
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
            loadingTransaction: function(){
                let points = 0;
                if(this.transaction.clicked && this.transaction.status < 3){
                    let updateTitle = setInterval(()=>{
                        if(points < 4){
                            this.loadingEffect.innerHTML  = '.' + this.loadingEffect.innerHTML;
                        }
                        else{
                            this.loadingEffect.innerHTML = '';
                            points = 0;
                        }
                        points++;

                        if(this.transaction.status > 2){
                            clearInterval(updateTitle);
                            this.loadingEffect.innerHTML = '';
                        }
                    }, 200);
                }
            },
            transactionStatus: function (status) {
                switch (status) {
                    case 0:
                        return 'Pending Approval';
                    case 1:
                        return 'Approved';
                    case 2:
                        return 'Pending Transaction';
                    case 3:
                        return 'Completed';
                    case 4:
                        return 'Rejected';
                }
            }
        }
    }
</script>
<style>

</style>
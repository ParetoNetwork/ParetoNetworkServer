<template>
    <div class="text-center position-relative pl-1">
        <div class="dot" :class="statusColor(transaction.status)"></div>
        <div class="row pl-1 ml-2 mr-0 py-3 cursor-pointer border-bottom text-content" style="border-bottom-color: black !important;">
            <div class="col-4 px-0 text-left" @click="clickTransaction()" >
                <div class="position-relative" >
                    {{transaction.event}}
                </div>
            </div>
            <div class="col-4 px-0" @click="clickTransaction()" >
                <p>  {{transaction.amount}} </p>
            </div>
            <a v-bind:href="etherscanUrl+'/tx/'+transaction.txHash"
               target="_blank" class="col-4 px-0 pl-1">
                <p class="ellipsis">  {{transaction.txHash}} </p>
            </a>
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
            'transaction.clicked' : function (valNew, valOld) {
                this.loadingTransaction();
            }
        },
        mounted : function(){
            let newId = this.transaction.txHash + '-span';
            this.clicked = this.transaction.clicked;
            this.loadingEffect = document.getElementById(newId);
            this.loadingTransaction();
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
                    this.loadingTransaction();
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
            loadingTransaction(){
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
            statusColor(status){
                let click = this.clicked || this.transaction.clicked;
                return {
                    'red-background' : status == 4 || status < 3 && !click,
                    'green-background' : status == 3,
                    'yellow-background' : status < 3 && click
                };
            },
            transactionStatus: function (status) {

            }
        }
    }
</script>
<style>

</style>
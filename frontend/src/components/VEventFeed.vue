<template>
    <div>
        <VShimmerMyPost v-if="!myContent.length && !loadedMyContent"></VShimmerMyPost>
        <div v-else class="border mb-3 mb-md-1 px-2">
            <div class="p-2 py-4">
                <div class="text-left border-bottom p-1">
                    <h5 class="title "><b>EVENTS</b></h5>
                    <p v-if="alertTransactions > 0" class="pt-1" style="color: red">
                        <i class="fa fa-exclamation-circle"></i> You got some pending transactions, click on them to complete them</p>
                </div>
                <div class="mt-1 p-1">
                    <div v-for="tx in pendingTransactions" class="d-flex justify-content-between cursor-pointer">
                        <div>Event: {{(tx.event == 'distribute')? 'collect': tx.event}}</div>
                        <div v-if="tx.event !== 'distribute'" @click="clickTransaction(tx)"> Amount: {{tx.amount}}</div>
                        <div @click="clickTransaction(tx)"> Status: {{transactionStatus(tx.status)}}</div>
                        <a class="text-primary" :href="etherscanUrl + '/tx/' + (tx.txRewardHash || tx.txHash)" target="_blank"> txid: {{tx.txHash.substring(0,10)}} </a>
                    </div>
                </div>
                <button v-if="false" class="btn btn-success-pareto button-margin" @click="goToIntelPage()">POST
                    NEW INTEL
                </button>
            </div>
            <div class="p-2 scrollable" id="mypost" v-on:scroll="scrollMyPost()">
                <ul v-if="myContent.length" class="list-group list-unstyled">
                    <li class="list-group-item border-0" v-for="post in myContent" :key="post.id">
                        <VIntelPreview :user="user" :intel="post" :eventRow="true"></VIntelPreview>
                    </li>
                </ul>
                <span v-else> No data to display </span>
            </div>
        </div>
    </div>
</template>

<script>
    import { mapState, mapActions } from "vuex";
    import ContentService from "../services/ContentService";
    import dashboardService from "../services/dashboardService";
    import VShimmerMyPost from "./Shimmer/IntelView/VShimmerMyPost";
    import VIntelPreview from "./VIntelPreview";

    export default {
        name: "VEventFeed",
        props: [
            'user'
        ],
        data: function(){
            return {
                alertTransactions: 0,
                etherscanUrl: window.localStorage.getItem('etherscan'),
                loadedMyContent: false,
                myContent : [],
                allMyContent: [],
            }
        },
        components: {
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
        watch: {
            'pendingTransactions' : function () {
                this.pendingTransactions.forEach(tx => {
                    if (!tx.clicked) this.alertTransactions++;
                });
            }
        },
        mounted: function() {

            this.getTransactions();
            this.loadMyContent();
        },
        methods: {
            ...mapActions(["addTransaction", "transactionComplete", "assignTransactions", "editTransaction"]),
            clickTransaction: function(transaction){
                this.alertTransactions--;
                if(!transaction.clicked) {
                    transaction.clicked = true;
                    ContentService.pendingTransactionApproval(
                        transaction,
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
                                title: 'Event: ' + transaction.event,
                                text: 'Confirmed ' + transaction.event
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
            //Loads the pendingTransactions state
            getTransactions: function () {
                return ContentService.getTransactions(data => {
                    this.assignTransactions(data);
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
                return dashboardService.getContent('',
                    res => {
                        this.allMyContent = res;
                        this.loadedMyContent = true;
                        this.myContent = this.allMyContent.slice(0, 10);
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
            scrollMyPost: function () {
                console.log('anything')
                let list = document.getElementById("mypost");
                console.log(list.scrollTop + list.offsetHeight + 10)
                console.log(list.scrollHeight)
                if (list.scrollTop + list.offsetHeight + 10 >= list.scrollHeight
                    && this.myContent.length < this.allMyContent.length) {
                    this.myContent = this.allMyContent.slice(0, this.myContent.length + 10);
                }
            },
            transactionStatus: function(status) {
                switch (status){
                    case 0:
                        return 'Pending Approval';
                    case 1:
                        return 'Approved';
                    case 2:
                        return 'Pending Reward';
                    case 3:
                        return 'Completed';
                    case 4:
                        return 'Rejected';
                }
            },
        }
    }
</script>

<style scoped>

</style>
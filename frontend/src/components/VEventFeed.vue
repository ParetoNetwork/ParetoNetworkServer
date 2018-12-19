<template>
    <div>
        <VShimmerMyPost v-if="!myContent.length && !loadedMyContent"></VShimmerMyPost>
        <div v-else class="border mb-3 mb-md-1 px-2">
            <div class="p-2 pt-4">
                <div class="text-left border-bottom p-1">
                    <h5 class="title "><b>EVENTS</b></h5>
                </div>
                <button v-if="false" class="btn btn-success-pareto button-margin" @click="goToIntelPage()">POST
                    NEW INTEL
                </button>
            </div>
            <div class="p-2 scrollable" id="mypost" v-on:scroll="scrollMyPost()">
                <ul v-if="pendingTransactions.length" class="list-group list-unstyled">
                    <li class="list-group-item border-0" v-for="tx in pendingTransactions">
                        <VIntelPreview v-if="tx.intelInfo" :user="user" :intel="tx.intelInfo" :eventRow="true"></VIntelPreview>
                        <VTransaction v-else @click.native="clickTransaction(tx)" :transaction="tx"></VTransaction>
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
    import VTransaction from "./VTransaction";
    import {Promise} from "es6-promise";

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
                allContent : [],
                page: 0,
                limit: 10,
                isLoadingScroll: false
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
        mounted: function() {
            this.loadRequest();
        },
        watch: {

        },
        methods: {
            ...mapActions(["addTransaction", "transactionComplete", "assignTransactions", "editTransaction"]),
            clickTransaction: function(transaction){

                if(transaction.status >= 3) {
                    this.$notify({
                        group: 'notification',
                        type: 'warning',
                        title: 'Transaction Completed',
                        duration: 10000,
                        text: 'This transaction was already completed'
                    });
                    return;
                }

                if(!transaction.clicked) {
                    transaction.clicked = true;
                    this.alertTransactions--;
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
            //Loads the pendingTransactions state
            getTransactions: function () {
                let params = {q : 'all', page: this.page, limit: 10};
                return ContentService.getTransactions(params, data => {
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
                let params = {page: this.page, limit: 10};
                return dashboardService.getContent(params,
                    res => {
                        this.loadedMyContent = true;
                        this.myContent = [...this.myContent,...res];
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
            loadRequest : function(){
                Promise.all([
                    this.getTransactions(),
                    this.loadMyContent()
                ]).then(values => {
                    this.$store.state.makingRequest = false;
                    this.isLoadingScroll = false;
                    this.page += 1;

                    this.pendingTransactions.forEach( tx => {
                        if(tx.event === 'create' && tx.status > 2){
                            this.myContent.forEach( item => {
                                if(item.id == tx.intel){
                                    this.editTransaction({hash: tx.txHash, key: 'intelInfo', value: item});
                                }
                            });
                        }

                        if(tx.status <= 2 && !tx.clicked){
                            console.log("theres one")
                            this.alertTransactions++;
                        }
                    });
                });
            },
            scrollMyPost: function () {
                let list = document.getElementById("mypost");

                if (list.scrollTop + list.offsetHeight + 10 >= list.scrollHeight && !this.isLoadingScroll) {
                    this.$store.state.makingRequest = true;
                    this.isLoadingScroll = true;
                    this.loadRequest();
                }
            }
        }
    }
</script>

<style scoped>

</style>
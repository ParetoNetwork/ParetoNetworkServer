<template>
    <div class="text-left">
        <div class="row p-0 cursor-pointer" >
            <div class="col-12 col-lg-7 p-0">
                <h1 class="title" v-line-clamp="2">{{transactionStatus(transaction.status)}}
                    <i v-if="transaction.status < 3" class="fa fa-exclamation-circle" style="color: red"></i>
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
            "transaction"
        ],
        mixins: [countUpMixin],
        components: {
            ICountUp
        },
        data: function () {
            return {
                etherscanUrl: window.localStorage.getItem('etherscan'),
            }
        },
        filters: {
            dateFilter: function formatDate(date) {
                const temp = moment(date);
                return temp.format("MMMM Do, YYYY");
            }
        },
        methods: {
            ...mapActions(["addTransaction", "transactionComplete", "assignTransactions", "editTransaction"]),
            dateStringFormat(date) {
                return new Date(date);
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
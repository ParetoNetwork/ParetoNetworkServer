<template>
    <div>
        <div v-if="!loading" class="border p-2">
            <div class="border-bottom p-2 p-md-3">
                <h5 class="title">MY INTEL FEED</h5>
            </div>
            <!--
            <div >
                <span> No data to display </span>
            </div>
            -->

            <div class="scrollable" id="myfeed" v-on:scroll="scrollMyFeed()">
                <ul class="list-unstyled list-group">
                    <li class="text-left list-group-item border-0 px-1 py-2" :key="row._id"
                        v-for="row of myFeed.content">
                        <div class="row pb-2">
                            <router-link tag="div" :to="intelRoute(row)" class="col-lg-9 pr-0">
                                <div class="row cursor-pointer">
                                    <div class="col-2">
                                        <div class="border p-1 mr-2" style="height: 50px; width: 50px;">
                                            <div data-v-514e8c24="" class="thumb"
                                                 v-bind:style="{ backgroundImage: 'url( ' + loadProfileImage(row.createdBy.profilePic)}"
                                                 style="width: 40px; height: 40px;"></div>
                                        </div>
                                    </div>
                                    <div class="col-10 px-lg-1">
                                        <div class="d-flex flex-column flex-grow-1 pr-3">
                                            <h1 class="title ellipsis">{{row.title|| 'No title'}}</h1>
                                            <div class="">
                                                <span class="text-dashboard">Rewarded {{row.rewarded}} Times</span>
                                                <div>
                                                    <span class="text-dashboard">Disclosed by: <!-- <a v-bind:href="'/'+row.createdBy.address"> --> {{row.createdBy.alias ? row.createdBy.alias : row.createdBy.address}} <!-- </a> --></span>
                                                </div>

                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </router-link>

                            <div class="col-12 col-lg-2 mt-2 mt-lg-0 ml-1 px-0">
                                <div v-if="false" class="text-right font-weight-bold">
                                    <img src="../assets/images/icon-mini.svg" alt="" class="icon-mini">
                                    <span class="text-right">{{row.totalReward}}</span>
                                </div>
                                <div class="text-center">
                                    <VIntelButtonAction :user="user" :intel="row"></VIntelButtonAction>
                                </div>
                            </div>

                        </div>
                        <div class="row border-bottom">

                            <!-- blocks ago -->
                            <div class="col-md col-xs ellipsis">
                                <a style="color: #000;" v-bind:href="etherscanUrl+'/tx/'+row.txHash" target="_blank">
                                    <i class="fa fa-th-large" style="color: #000; margin: 5px;"></i>
                                    <ICountUp
                                            :startVal="parseFloat(row.block) + parseFloat(row.blockAgo)"
                                            :endVal="parseFloat(row.blockAgo)"
                                            :decimals="decimalsLength(row.blockAgo)"
                                            :duration="randomNumber(1,3)"
                                            :options="countUp.options"
                                            @ready="onReady"/>

                                </a>
                            </div>

                            <!-- time ago with txid link to etherscan -->

                            <div class="col-md col-xs-4 ellipsis" style="text-align: center;">
                                <a style="color: #000;" v-bind:href="etherscanUrl+'/tx/'+row.txHash" target="_blank"><i class="fa fa-calendar-o" style="color: #000;"></i>&nbsp;
                                    <span class="text-dashboard"><b><!-- {{dateStringFormat(row.dateCreated).toLocaleString("en-US") }} - -->{{ dateStringFormat(row.dateCreated)| moment("from", "now") }}</b></span></a>
                            </div>

                            <!-- rewards collected, align right -->
                            <div class="col-md col-xs">
                                <p class="text-right text-secondary ellipsis" style="margin-right: 5px;"><img
                                        src="../assets/images/LogoMarkColor.svg" width="20px" alt="">
                                    <b> {{ row.totalReward }} </b>
                                </p>
                            </div>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
        <VShimmerFeed v-else></VShimmerFeed>
    </div>
</template>

<script>
    import ICountUp from "vue-countup-v2";
    import {countUpMixin} from "../mixins/countUp";
    import moment from "moment";
    import environment from "../utils/environment";

    import {mapState, mapMutations, mapActions} from "vuex";

    import dashboardService from "../services/dashboardService";
    import profileService from "../services/profileService";

    import VShimmerFeed from "./Shimmer/IntelView/VShimmerFeed";

    import VIntelButtonAction from "./Events/VIntelButtonAction";
    import VModalReward from "./Modals/VModalReward";

    export default {
        name: "VIntelFeed",
        components: {
            ICountUp,
            VShimmerFeed,
            VIntelButtonAction,
            VModalReward
        },
        props: [
            'updateContent', 'block', 'user', 'fetchAddress', 'title', 'address'
        ],
        mixins: [countUpMixin],
        data: function () {
            return {
                allMyContent: [],
                baseURL: environment.baseURL,
                moment: moment,
                etherscanUrl: window.localStorage.getItem('etherscan'),
                myFeed: {
                    content: [],
                    loading: false,
                    page: 0,
                },
                loading: true,
                intel: {}
            }
        },
        computed: {
            ...mapState(["madeLogin", "ws", "signType", "pathId", "pendingTransactions", "showModalReward"]),
            ...mapActions(["addTransaction", "transactionComplete", "editTransaction"]),
        },
        beforeMount: function () {
            this.loadContent();
            console.log(this.user);
        },
        watch: {
            //Updates when parent view, which has the webSocket, receives new information and refreshes
            updateContent: function (uC) {
                this.updateFeedContent();
            },
            block: function (block) {
                this.assignBlock(block);
            }
        },
        methods: {
            ...mapMutations(["openModalReward"]),
            assignBlock(block) {
                this.myFeed.content = this.myFeed.content.map(item => {
                    item.blockAgo = block - item.block > 0 ? block - item.block : 0;
                    return item;
                });
            },
            creatorRoute(address) {
                return '/intel/' + address + '/';
            },
            dateStringFormat(date) {
                return new Date(date);
            },
            intelRoute(intel) {
                let param = (intel.txHash === '0x0') ? intel._id : intel.txHash;
                return '/intel/' + intel.address + '/' + param;
            },
            loadContent: function (params) {
                params = params || null;

                let onSuccess = (res) => {
                    this.loading = false;
                    this.myFeed.page++;
                    this.myFeed.loading = false;
                    this.myFeed.content = [...this.myFeed.content, ...res];
                };

                let onError = (error) => {
                    this.loading = false;
                    let errorText = error.message ? error.message : error;
                    this.$notify({
                        group: 'notification',
                        type: 'error',
                        duration: 10000,
                        title: 'Content',
                        text: errorText
                    });
                };

                if (this.fetchAddress) {
                    let params = {
                        page: this.myFeed.page,
                        limit: 10,
                        user: this.fetchAddress
                    };
                    return dashboardService.getContent(params,
                        onSuccess,
                        onError
                    );
                } else {
                    return dashboardService.getAllContent(params,
                        onSuccess,
                        onError
                    );
                }
            },
            updateFeedContent: function () {
                let params = {
                    page: 0,
                    limit: this.myFeed.content.length,
                    user: this.fetchAddress
                };
                return dashboardService.getAllContent(params, res => {
                        res.forEach(intel => {
                            let found = false;
                            this.myFeed.content = this.myFeed.content.map(myFeedintel => {
                                if (intel._id === myFeedintel._id) {
                                    myFeedintel = intel;
                                    found = true;
                                }
                                return myFeedintel;
                            });
                            if (!found) {
                                this.myFeed.content.unshift(intel);
                            }
                        });
                    },
                    error => {
                        let errorText = error.message ? error.message : error;
                        this.$notify({
                            group: 'notification',
                            type: 'error',
                            duration: 10000,
                            title: 'Content',
                            text: errorText
                        });
                    }
                );
            },
            loadProfileImage: function (pic) {
                let path = this.baseURL + "/profile-image?image=";
                return profileService.getProfileImage(path, pic);
            },
            randomNumber: function (min = 1, max = 3) {
                return Math.floor(Math.random() * (max - min + 1) + min);
            },
            scrollMyFeed: function () {
                let list = document.getElementById("myfeed");

                if (list.scrollTop + list.offsetHeight >= list.scrollHeight * 0.9
                    && !this.myFeed.loading) {
                    const params = {limit: 10, page: this.myFeed.page};
                    this.myFeed.loading = true;

                    this.$store.state.makingRequest = true;

                    let myFeedContentReady = this.loadContent(params);
                    myFeedContentReady.then(() => {
                        this.$store.state.makingRequest = false;
                    });
                }
            }
        }
    }
</script>

<style scoped>
</style>
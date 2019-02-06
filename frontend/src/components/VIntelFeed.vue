<template>
    <div class="intel-container">
        <div v-if="!loading && address" class="px-3 pl-xl-5 py-4 text-left">
            <b class="title-content">
                MY INTEL FEED
            </b>
            <div class="row text-content mt-4">
                <div class="col-4 col-md-4 col-lg-2">
                    CONTRIBUTOR
                </div>
                <div class="col-8 col-md-8 col-lg-10 pl-lg-3">
                    INTEL
                </div>
            </div>
            <div class="scrollable pr-lg-2" id="myfeed" v-on:scroll="scrollMyFeed()">
                <ul>
                    <li class="text-left border-0 py-2" :key="row._id"
                        v-for="row of myFeed.content">
                        <VIntelPreview :user="user" :intel="row" :eventRow="false"></VIntelPreview>
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
    import VIntelPreview from "./VIntelPreview";

    export default {
        name: "VIntelFeed",
        components: {
            ICountUp,
            VShimmerFeed,
            VIntelButtonAction,
            VModalReward,
            VIntelPreview
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
            this.loadContent({page: 0, limit: 10});
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
                    console.log('the error was here')
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
            }
        }
    }
</script>

<style scoped>
</style>
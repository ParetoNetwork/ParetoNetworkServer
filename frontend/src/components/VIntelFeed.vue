<template>
    <div>
        <div v-if="!loading" class="border p-2">
            <div class="border-bottom p-2 p-md-3">
                <h5 class="title"> {{title || 'MY INTEL FEED:'}} </h5>
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
                        <div class="row border-bottom pb-2">
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
                                                <span v-if="false" class="text-dashboard">Rewarded {{row.rewarded}} Times</span>
                                                <div>
                                                    <span class="text-dashboard">Disclosed by: {{row.address}}
                                                    </span>
                                                </div>
                                                <div>
                                                    Blocks ago:
                                                    <ICountUp
                                                            :startVal="parseFloat(row.block) + parseFloat(row.blockAgo)"
                                                            :endVal="parseFloat(row.blockAgo)"
                                                            :decimals="decimalsLength(row.blockAgo)"
                                                            :duration="randomNumber(1,3)"
                                                            :options="countUp.options"
                                                            @ready="onReady"/>

                                                </div>
                                                <div>
                                                    <span class="text-dashboard">
                                                        <b>
                                                            {{dateStringFormat(row.dateCreated).toLocaleString("en-US") }} - {{ dateStringFormat(row.dateCreated)| moment("from", "now") }}
                                                        </b>
                                                    </span>
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
                                <div v-if="user.address != row.address && row.intelAddress && signType != 'Manual' && row.expires > Math.round(new Date().getTime() / 1000)"
                                     class="text-center">
                                    <div class="d-inline-block">
                                        <p class="text-right text-secondary ellipsis reward-text"><img
                                                src="../assets/images/LogoMarkColor.svg" width="20px" alt="">
                                            <b> {{ row.totalReward }} </b>
                                        </p>
                                        <b-btn class="btn-primary-pareto mx-auto px-4"
                                               style="width: 120px;"
                                               v-b-modal.modalToken @click="openRewardModal(row)">
                                            <img src="../assets/images/LogoMarkWhite.svg" width="20px" alt="">
                                            <b> {{ row.reward }} </b>
                                        </b-btn>
                                    </div>
                                </div>
                            </div>

                        </div>

                    </li>
                </ul>
            </div>
            <b-modal
                    id="modalToken"
                    ref="modalToken"
                    centered
                    hide-header
                    hide-footer
                    :body-bg-variant="'dark'"
                    :body-text-variant="'light'">
                <b-container fluid>
                    <h4 class="font-body mb-3"> Reward</h4>
                    <div v-if="this.signType==='LedgerNano'" class="text-left">
                        <p> Before use Ledger Nano S, verify the next items: </p>
                        <div class="m-2 ml-4">
                            <ul>
                                <li> The Browser must be Google Chrome</li>
                                <li> Plugged-in their Ledger Wallet Nano S</li>
                                <li> Input digits pin</li>
                                <li> Navigated to the Ethereum app on their device</li>
                                <li> Enabled 'browser' support from the Ethereum app settings</li>
                            </ul>
                        </div>
                        <br/>
                    </div>
                    <p class="text-dashboard mb-2" style="font-size: 16px"> Please enter the number of Pareto Tokens to
                        reward</p>
                    <b-form-input
                            v-model="tokenAmount"
                            style="font-size: 25px"
                            :formatter="formatAmountNumber"
                            type="number">
                    </b-form-input>
                    <b-row class="m-2 mt-4 d-flex justify-content-center">
                        <b-button class="mr-2" variant="danger" @click="hideModal()"> Cancel</b-button>
                        <b-button :disabled="!hardwareAvailable || tokenAmount<=0 ||  user.tokens < tokenAmount"
                                  style="background-color: rgb(107, 194, 123)" variant="success"
                                  @click="rewardIntel(rewardId, tokenAmount, intelAddress)"> Confirm
                        </b-button>
                    </b-row>
                </b-container>
            </b-modal>
            <div>
                <b-modal
                        no-close-on-backdrop
                        v-model="modalWaiting"
                        centered
                        hide-header
                        hide-footer
                        :body-bg-variant="'dark'"
                        :body-text-variant="'light'">

                    <b-container fluid>
                        <h3 class="font-body mb-4">Reward has a two step confirmation </h3>
                        <div>
                            <div class="m-2 ml-4">
                                <ol class="text-left">
                                    <li>First, confirm the amount of Pareto that you'd like to
                                        deposit
                                    </li>
                                    <li>Last, reward on the Ethereum Blockchain</li>
                                </ol>
                                <p class="text-center mt-4"
                                   style="text-align: justify !important; text-justify: inter-word;">
                                    This operation may take a while as we communicate with the Ethereum Blockchain.
                                    Please do not close your browser or navigate to a different page. </p>
                                <i class="fa fa-spinner fa-spin fa-3x mt-4"></i>
                            </div>

                            <div v-if="this.signType!=='LedgerNano'" class="d-flex justify-content-between mt-4 mb-1">
                                <p class="text-center" style="font-size: 11px">
                                    If MetaMask does not popup, please check your MetaMask extension icon for a new
                                    badge
                                    that signifies an operation should be taken on MetaMask

                                </p>
                                <span class="mt-1 ml-2"
                                      style="background: #505050;
                                             border-radius: 3px;
                                             padding-left: 2px;">
                                <img src="../assets/images/mmicon.png" alt=""
                                     class="icon-mini">
                            </span>
                            </div>

                        </div>
                    </b-container>
                </b-modal>
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
    import fromExponential from 'from-exponential';

    import {mapState, mapActions} from "vuex";

    import ContentService from "../services/ContentService";
    import AuthService from "../services/authService";
    import dashboardService from "../services/dashboardService";
    import profileService from "../services/profileService";

    import VShimmerFeed from "./Shimmer/IntelView/VShimmerFeed";

    export default {
        name: "VIntelFeed",
        components: {
            ICountUp,
            VShimmerFeed
        },
        props: [
            'updateContent', 'block', 'user', 'fetchAddress', 'title'
        ],
        mixins: [countUpMixin],
        data: function () {
            return {
                allMyContent: [],
                baseURL: environment.baseURL,
                intelAddress: '',
                hardwareAvailable: false,
                moment: moment,
                modalWaiting: false,
                myFeed: {
                    content: [],
                    loading: false,
                    page: 0,
                },
                rewardId: '',
                tokenAmount: 1,
                loading: true
            }
        },
        computed: {
            ...mapState(["madeLogin", "ws", "signType", "pathId"])
        },
        beforeMount: function () {
            this.loadContent();
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
            ...mapActions(["addTransaction", "transactionComplete"]),
            assignBlock(block) {
                this.myFeed.content = this.myFeed.content.map(item => {
                    item.blockAgo = block - item.block > 0 ? block - item.block : 0;
                    return item;
                });
            },
            dateStringFormat(date) {
                return new Date(date);
            },
            intelRoute(intel) {
                let param = (intel.txHash === '0x0') ? intel._id : intel.txHash;
                return '/intel/' + intel.address + '/' + param;
            },
            hideModal() {
                if (this.signType === 'LedgerNano') {
                    AuthService.deleteWatchNano();
                    this.hardwareAvailable = false;
                }
                this.$refs.modalToken.hide()
            },
            isAvailable() {
                if (this.signType === 'LedgerNano') {
                    this.hardwareAvailable = false;
                    AuthService.doWhenIsConnected(() => {
                        this.hardwareAvailable = true;
                        AuthService.deleteWatchNano();
                    })
                } else {
                    this.hardwareAvailable = true;
                }
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
            openRewardModal: function (row) {
                this.rewardId = row.id;
                this.intelAddress = row.intelAddress;
                this.tokenAmount = Math.min(this.user.tokens, row.reward);
                this.isAvailable();
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
            formatAmountNumber: function (value, event) {
                return fromExponential(value);
            },
            randomNumber: function (min = 1, max = 3) {
                return Math.floor(Math.random() * (max - min + 1) + min);
            },
            rewardIntel: function (ID, tokenAmount, intelAddress) {
                this.hideModal();
                //this.modalWaiting = true;
                if (!tokenAmount) {
                    this.$notify({
                        group: 'notification',
                        type: 'error',
                        duration: 10000,
                        text: 'No Token Amount'
                    });

                    this.tokenAmount = 1;
                    return;
                }

                ContentService.rewardIntel(
                    {ID, tokenAmount, intelAddress},
                    {signType: this.signType, pathId: this.pathId},
                    {
                        addTransaction : this.addTransaction,
                        transactionComplete: this.transactionComplete
                    }
                    ,
                    res => {
                        this.modalWaiting = false;
                        this.$notify({
                            group: 'notification',
                            type: 'success',
                            duration: 10000,
                            text: 'Success'
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
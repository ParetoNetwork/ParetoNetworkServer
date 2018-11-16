<template>
    <div class="main wrapp">
        <div class="container">
            <div class="row mx-2 pt-5">
                <div class="col-12 order-last order-lg-first col-lg-4 mb-4 p-0">
                    <VProfile :addressProfile="intel.address"></VProfile>
                </div>
                <div class="col-12 col-lg-7 offset-lg-1 mb-4 p-0">
                    <div class="row text-group">
                        <VShimmerIntelInformation v-if="!intel.blockAgo"></VShimmerIntelInformation>
                        <div v-else class="col-12 border p-3">
                            <div class="row py-4 m-0">
                                <div class="col-md-10 p-0 pr-1">
                                    <span class="name-title"> {{intel.title}} </span>
                                </div>
                                <div class="col-md-2 p-0 pl-1">
                                    <div class="d-flex flex-column align-items-end">
                                        <span v-if="profile.alias" class="subtitle-dashboard"><b> {{profile.alias}} </b></span>
                                        <span v-else class="subtitle-dashboard"><b> {{intel.address.slice(0,15) + '...'}} </b></span>
                                        <div class="text-center">
                                            <VIntelButtonAction @intelReward="intelReward" :user="user" :intel="intel"></VIntelButtonAction>
                                        </div>
                                    </div>
                                </div>

                            </div>
                            <div class="row border-bottom">
                                <!-- blocks ago -->
                                <div class="col-md col-xs ellipsis">
                                    <a style="color: #000;" v-bind:href="etherscanUrl+'/tx/'+intel.txHash"
                                       target="_blank">
                                        <i class="fa fa-th-large" style="color: #000; margin: 5px;"></i>
                                        <ICountUp
                                                :startVal="parseFloat(intel.block) + parseFloat(intel.blockAgo)"
                                                :endVal="parseFloat(intel.blockAgo)"
                                                :decimals="decimalsLength(intel.blockAgo)"
                                                :duration="randomNumber(1,3)"
                                                :options="countUp.options"
                                                @ready="onReady"/>

                                    </a>
                                </div>

                                <!-- time ago with txid link to etherscan -->

                                <div class="col-md col-xs-4 ellipsis" style="text-align: center;">
                                    <a style="color: #000;" v-bind:href="etherscanUrl+'/tx/'+intel.txHash"
                                       target="_blank"><i class="fa fa-calendar-o" style="color: #000;"></i>&nbsp;
                                        <span class="text-dashboard"><b><!-- {{dateStringFormat(intel.dateCreated).toLocaleString("en-US") }} - -->{{ dateStringFormat(intel.dateCreated)| moment("from", "now") }}</b></span></a>
                                </div>

                                <!-- rewards collected, align right -->
                                <div class="col-md col-xs">
                                    <p class="text-right text-secondary ellipsis" style="margin-right: 5px;"><img
                                            src="../assets/images/LogoMarkColor.svg" width="20px" alt="">
                                        <b> {{ intel.totalReward }} </b>
                                    </p>
                                </div>
                            </div>
                            <div class="text-group mt-4">
                                <p v-html="intel.body"></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <VModalReward :intel="intel" :userTokens="user.tokens" v-if="showModalReward"></VModalReward>
    </div>
</template>
<script>
    import DashboardService from '../services/dashboardService';
    import ProfileService from '../services/profileService';
    import ContentService from '../services/ContentService';

    import ICountUp from 'vue-countup-v2';
    import {mapMutations, mapState, mapActions} from "vuex";
    import {countUpMixin} from "../mixins/countUp";
    import AuthService from "../services/authService";
    import environment from '../utils/environment';

    import VProfile from "./VProfile.vue";

    import VShimmerUserProfile from "./Shimmer/IntelDetailView/VShimmerUserProfile";
    import VShimmerIntelInformation from "./Shimmer/IntelDetailView/VShimmerIntelInformation";
    import VIntelButtonAction from "./Events/VIntelButtonAction";

    import VModalReward from "./Modals/VModalReward";

    export default {
        name: 'VIntelDetail',
        mixins: [countUpMixin],
        components: {
            ICountUp,
            VShimmerUserProfile,
            VShimmerIntelInformation,
            VProfile,
            VIntelButtonAction,
            VModalReward
        },
        computed: {
            ...mapState(["ws", "signType", "pendingTransactions", "showModalReward"])
        },
        data: function () {
            return {
                id: this.$route.params.id,
                loading: true,
                intel: {},
                address: {},
                etherscanUrl: window.localStorage.getItem('etherscan'),
                profile: {
                    address: '',
                    alias: '',
                    biography: '',
                    rank: 1000
                },
                user: {},
                intelReward: {},
                baseURL: environment.baseURL
            };
        },
        beforeMount: function () {
            this.$store.state.makingRequest = true;
            this.requestCall()
            // console.log(this.$route.params);
        },
        methods: {
            ...mapMutations(["iniWs", "openModalReward"]),
            ...mapActions(["addTransaction", "transactionComplete", "editTransaction"]),
            dateStringFormat(date) {
                return new Date(date);
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
            intelReward(intel){
                this.intel = intel;
            },
            getIntel: function () {
                return DashboardService.getIntel(this.id, res => {
                    this.getProfile(res.address);
                    this.intel = res;
                    console.log(this.intel);
                }, error => {
                });
            },
            getProfile: function (address) {
                ProfileService.getSpecificProfile(res => {
                    this.profile = res;
                    this.loading = false;
                }, error => {
                }, address)
            },
            loadProfileImage: function (pic) {
                let path = this.baseURL + '/profile-image?image=';
                return ProfileService.getProfileImage(path, pic);
            },
            getAddress: function () {
                return DashboardService.getAddress(res => {
                    // console.log(res)
                    this.address = res;
                }, () => {
                    alert(error);
                });
            },
            socketConnection() {
                let params = {rank: this.rank, limit: 100, page: this.page};
                if (!this.ws) {
                    AuthService.getSocketToken(res => {
                        this.iniWs();
                        let wss = this.ws;
                        this.ws.onopen = function open() {
                            wss.send(JSON.stringify(params));
                        };
                        this.overrideOnMessage();
                    });
                } else {
                    this.overrideOnMessage();
                }
            },
            openRewardModal: function () {
                this.openModalReward(true);
            },
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
            loadProfile: function () {
                return ProfileService.getProfile(
                    res => {
                        this.user = res;
                    },
                    () => {
                    }
                );
            },
            overrideOnMessage() {
                this.ws.onmessage = (data) => {
                    try {
                        const info = JSON.parse(data.data);

                        if (info.data.address) {
                            this.intel.blockAgo = info.data.block - this.intel.block;
                        }
                    } catch (e) {
                        console.log(e);
                    }
                };
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
            requestCall: function () {
                Promise.all([
                    this.getIntel(),
                    this.getAddress(),
                    this.loadProfile()
                ]).then(values => {
                    this.$store.state.makingRequest = false;
                    this.socketConnection();
                });
            }
        }
    };
</script>

<style scoped lang="scss">
</style>
<template>
    <div class="container main  wrapp">
        <notifications group="auth" position="bottom right"/>
        <div class="row pt-5">
            <div class="col-md-5 mb-5 mt-2 m-sm-0">
                <VShimmerUser v-if="!user.address"></VShimmerUser>
                <template v-else>
                    <div class="media py-1 px-4 border mb-3 mb-md-5">
                        <div class="d-flex flex-column mr-2">
                            <div class="border p-2 mb-2" @click="openInput()">
                                <div data-v-514e8c24="" class="thumb" id="wrapper"
                                     v-bind:style="{ backgroundImage: 'url( ' + loadProfileImage(user.profile_pic, user.address)}"
                                     style="width: 100px; height: 100px;">
                                    <div class="text text-white justify-content-center align-items-center h-100 w-100"><span>Change Image <i
                                            class="fa fa-pencil"
                                            aria-hidden="true"></i></span>
                                    </div>
                                </div>
                                <input type="file" class="d-none" id="file" ref="file" v-on:change="updatePicture()"/>
                            </div>
                        </div>

                        <div class="media-body flex-column text-left ellipsis">
                            <router-link tag="div" :to="creatorRoute(user.address)" v-if="user.address" class="cursor-pointer ellipsis">
                                <svg class="fa fa-user" style="color: #4e555b; margin: 2px;"></svg>
                                <span v-if="user.alias" class="name-title"><b>{{user.alias}}<br/></b></span>
                                <span class="ellipsis">{{user.address}}</span>
                            </router-link>

                            <!-- rank, icon globe color should be contingent on access level, whether above or below the threshold. Globe icon for "global rank" -->
                            <router-link tag="div" class="cursor-pointer" :to="leaderboards(user.address)">
                                <div class="row mt-2">
                                    <!-- score, star for score, earn more stars for a greater score -->
                                    <div class="col-md col-xs mb-2 ellipsis">
                                        <i class="fa fa-star" style="color: #fca130; margin: 2px;"></i>
                                        <ICountUp
                                                v-if="user.score"
                                                :startVal="countUp.startVal"
                                                :endVal="parseFloat(user.score)"
                                                :decimals="decimalsLength(user.score)"
                                                :duration="randomNumber(3,6)"
                                                :options="countUp.options"
                                                @ready="onReady"/>
                                        <span v-else> 0 </span>
                                    </div>
                                    <div class="col-md col-xs mb-2 ellipsis">
                                        <i class="fa fa-globe" style="color: #1f69c0; margin: 2px;"></i>
                                        <ICountUp
                                                :startVal="countUp.startVal"
                                                :endVal="parseFloat(user.rank)"
                                                :decimals="decimalsLength(user.rank)"
                                                :duration="randomNumber(3,6)"
                                                :options="countUp.options"
                                                @ready="onReady"/>
                                    </div>
                                </div>
                            </router-link>

                            <div class="mb-2">
                                <img src="../assets/images/LogoMarkColor.svg" width="20px" alt="" class="mr-2">
                                <a style="color: #000;" v-bind:href="etherscanUrl+'/token/'+paretoAddress+'?a='+user.address" target="_blank"><span class="title"><b>{{(user.tokens || '')}}<sup></sup></b></span>&nbsp;<i class="fa fa-external-link-alt" style="color: #1f69c0;"></i></a>
                            </div>

                            <!-- make this upwards of four lines before ellipsis -->
                            <i class="fa fa-edit cursor-pointer" style="color: #4e555b; margin: 2px;" @click="showModal"></i>{{user.biography || 'No biography provided'}}

                            <!--<router-link tag="button" class="btn btn-primary-pareto" :to="'/calculator'">-->
                            <!--Calculate-->
                            <!--</router-link>-->
                            <!--<div class="d-flex flex-column" style="padding-left: 1.8rem;">-->

                            <!---->
                            <!--<div class="">-->
                            <!--<span class="subtitle-dashboard"><b>BIO:</b></span>-->
                            <!--<p class="text-dashboard text-pareto-gray">-->

                            <!--</p>-->
                            <!--</div>-->
                            <!--</div>-->
                        </div>
                    </div>
                </template>
                <VEventFeed :user="user"></VEventFeed>
            </div>
            <div class="col-md-7 mb-3">
                <VIntelFeed :user="user" :updateContent="updateContentVar" :block="block" :address="address"></VIntelFeed>
            </div>
        </div>
        <b-modal ref="myModalRef" title="Edit Profile" ok-title="Update" @ok="updateProfile">
            <div class="d-block text-center">
                <form action="">
                    <label for="alias" style="float: left;">Name</label>
                    <div class="input-group mb-3">
                        <input v-model="alias" type="text" class="form-control" id="alias"
                               aria-describedby="basic-addon3">
                    </div>
                    <label for="bio" style="float: left;">Biography</label>
                    <div class="input-group mb-3">
                        <textarea v-model="bio" class="form-control" id="bio"
                                  aria-describedby="basic-addon3"> </textarea>
                    </div>
                </form>
            </div>
        </b-modal>
    </div>
</template>

<script>
    import dashboardService from "../services/dashboardService";
    import profileService from "../services/profileService";
    import moment from "moment";
    import AuthService from "../services/authService";
    import ContentService from "../services/ContentService";
    import ICountUp from "vue-countup-v2";

    import VIntelFeed from "./VIntelFeed.vue";
    import {mapMutations, mapState, mapActions} from "vuex";
    import environment from "../utils/environment";
    import {countUpMixin} from "../mixins/countUp";

    import VShimmerUser from "./Shimmer/IntelView/VShimmerUser";
    import VShimmerMyPost from "./Shimmer/IntelView/VShimmerMyPost";
    import VShimmerFeed from "./Shimmer/IntelView/VShimmerFeed";

    import VIntelButtonAction from "./Events/VIntelButtonAction";
    import VIntelPreview from "./VIntelPreview";
    import VEventFeed from "./VEventFeed";

    export default {
        name: "VIntel",
        mixins: [countUpMixin],
        components: {
            ICountUp,
            VShimmerUser,
            VShimmerMyPost,
            VShimmerFeed,
            VIntelFeed,
            VIntelButtonAction,
            VIntelPreview,
            VEventFeed
        },
        data: function () {
            return {
                address: null,
                loading: true,
                block: 0,
                tokenAmount: 1,
                moment: moment,
                alias: "",
                bio: "",
                picture: "",
                paretoAddress: window.localStorage.getItem('paretoAddress'),
                baseURL: environment.baseURL,
                etherscanUrl: window.localStorage.getItem('etherscan') ,
                user: {
                    rank: 0,
                    score: 0,
                    tokens: 0
                },
                updateContentVar: 0
            };
        },
        filters: {
            date: function formatDate(date) {
                const temp = moment(date);
                return temp.format("MMMM Do, YYYY");
            }
        },
        mounted: function () {
            this.main();
        },
        computed: {
            ...mapState(["madeLogin", "ws", "signType", "pathId", "pendingTransactions"]),
        },
        methods: {
            ...mapMutations(["intelEnter", "iniWs"]),
            ...mapActions(["addTransaction", "transactionComplete", "assignTransactions", "editTransaction"]),
            creatorRoute(address) {
                return '/intel/' + address + '/';
            },
            goToIntelPage: function () {
                window.location = '/#/create';
            },
            leaderboards(address){
                return '/leaderboards' + '?address=' + address;
            },
            loadAddress: function () {
                return dashboardService.getAddress(
                    res => {
                        this.user.address = res.address;
                        this.address = res;
                    },
                    error => {
                        let errorText = error.message ? error.message : error;
                        this.$notify({
                            group: 'notification',
                            type: 'error',
                            duration: 10000,
                            title: 'Login',
                            text: errorText
                        });
                    }
                );
            },
            numberToScientificNotation(number) {
                return (number + "").length > 12 ? number.toExponential(5) : number;
            },
            overrideOnMessage() {
                let wsa = this.ws;
                this.ws.onmessage = (data) => {
                    try {
                        const info = JSON.parse(data.data);
                        if (info.data.address) {
                            this.user.score = info.data.score;
                            this.user.rank = info.data.rank;
                            this.user.tokens = info.data.tokens;
                            // this.user.block = info.data.block;
                            this.block = info.data.block;
                        }
                        if (info.data.action) {
                            switch (info.data.action) {
                                case 'updateContent': {
                                    this.updateContentVar++;
                                }
                            }
                        }
                    } catch (e) {
                        console.log(e);
                    }
                };
            },
            socketConnection() {
                let params = {rank: this.rank, limit: 100, page: this.page};
                if (!this.ws) {
                    this.iniWs();
                    let wss = this.ws;
                    this.ws.onopen = function open() {
                        wss.send(JSON.stringify(params));
                    };
                }
                this.overrideOnMessage();
            },
            loadProfile: function () {
                return profileService.getProfile(
                    res => {
                        this.user = res;
                        this.alias = res.alias;
                        this.bio = res.biography;
                    },
                    () => {
                    }
                );
            },
            loadProfileImage: function (pic, profileAddress) {
                let path = this.baseURL + "/profile-image?image=";
                return profileService.getProfileImage(path, pic, profileAddress);
            },
            openInput: function () {
                document.getElementById("file").click();
            },
            randomNumber: function (min = 1, max = 3) {
                return Math.floor(Math.random() * (max - min + 1) + min);
            },
            requestCall: function () {
                Promise.all([
                    this.loadProfile(),
                    this.loadAddress()
                ]).then(values => {
                    this.$store.state.makingRequest = false;
                });
            },
            showModal() {
                this.$refs.myModalRef.show();
            },
            updatePicture: function () {
                let file = this.$refs.file.files[0];
                let formData = new FormData();
                formData.append("file", file);
                profileService.uploadProfilePic(formData, res => {
                    this.user.profile_pic = res;
                });
            },
            updateProfile() {
                const profile = {
                    alias: this.alias,
                    biography: this.bio
                };
                profileService.updateProfile(
                    profile,
                    res => {
                        this.$refs.myModalRef.hide();
                        this.loadProfile();
                    },
                    error => {
                    }
                );
            },
            main: function () {
                profileService.updateConfig( res => {this.etherscanUrl = window.localStorage.getItem('etherscan')});
                this.$store.state.makingRequest = true;
                if (!this.madeLogin) {
                    this.intelEnter();
                    AuthService.postSign(
                        () => {
                            this.requestCall();
                        },
                        () => {
                            this.socketConnection();
                            this.requestCall();
                        }
                    );
                } else {
                    this.socketConnection();
                    this.requestCall();
                }
            }
        }
    };
</script>

<style scoped lang="scss">


</style>
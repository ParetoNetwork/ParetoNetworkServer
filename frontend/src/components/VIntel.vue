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
                                     v-bind:style="{ backgroundImage: 'url( ' + loadProfileImage(user.profile_pic)}"
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
                                <i class="fa fa-user" style="color: #4e555b; margin: 2px;"></i>
                                <span v-if="user.alias" class="name-title"><b>{{user.alias}}<br/></b></span>
                                <span class="ellipsis">{{user.address}}</span>
                            </router-link>


                            <div class="mt-2">
                                <img src="../assets/images/LogoMarkColor.svg" width="20px" alt="" class="mr-2">
                                <a style="color: #000;" v-bind:href="etherscanUrl+'/token/'+paretoAddress+'?a='+user.address" target="_blank"><span class="title"><b>{{(user.tokens || '')}}<sup></sup></b></span>&nbsp;<i class="fa fa-external-link" style="color: #1f69c0;"></i></a>
                            </div>

                            <!-- rank, icon globe color should be contingent on access level, whether above or below the threshold. Globe icon for "global rank" -->
                            <router-link tag="div" class="cursor-pointer" :to="leaderboards(user.address)">
                                <div class="row mt-2">
                                    <div class="col-md col-xs mb-2 ellipsis">
                                            <i class="fa fa-area-chart" style="color: #4e555b; margin: 2px;"></i>
                                            <i class="fa fa-globe" style="color: #1f69c0; margin: 2px;"></i>
                                            <ICountUp
                                                    :startVal="countUp.startVal"
                                                    :endVal="parseFloat(user.rank)"
                                                    :decimals="decimalsLength(user.rank)"
                                                    :duration="randomNumber(3,6)"
                                                    :options="countUp.options"
                                                    @ready="onReady"/>
                                    </div>
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
                                </div>
                            </router-link>

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

                <VShimmerMyPost v-if="!myContent.length && !loadedMyContent"></VShimmerMyPost>
                <div v-else class="border  mb-3 mb-md-1 px-2 px-md-4 py-3">
                    <div class="p-3">
                        <h5 class="title text-left border-bottom p-2"><b>EVENTS</b></h5>
                        <div v-for="tx in pendingTransactions" class="mt-1">
                            <div class="d-flex justify-content-between cursor-pointer">
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
                    <div class="p-1 scrollable" id="mypost" v-on:scroll="scrollMyPost()">
                        <ul v-if="myContent.length" class="list-group list-unstyled">
                            <li class="list-group-item border-0 p-3" v-for="post in myContent" :key="post.id">
                                <div class="split">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <router-link tag="div" class="d-flex flex-column text-left" :to="intelRoute(post)">
                                            <h5 class="title ellipsis"><b>{{post.title}}</b></h5>
                                            <span v-if="!post.validated"> Pending Blockchain Confirmation</span>
                                            <span>{{post.dateCreated | date}}</span>
                                        </router-link>
                                        <div class="d-flex border" style="padding: 5px;">
                                            <a class="text-primary" :href="etherscanUrl + '/tx/' + (post.txRewardHash || post.txHash)" target="_blank">
                                                <span class="text-primary ellipsis"><u><b>txid:</b> {{post.txHash>7 ? post.txHash.slice(0,7):post.txHash }}</u></span>
                                                &nbsp;<i class="fa fa-external-link" style="color: #1f69c0;"></i></a>
                                        </div>
                                    </div>
                                </div>
                                <div class="row border-bottom">

                                    <!-- blocks ago -->
                                    <div class="col-md col-xs ellipsis text-left">
                                        <a style="color: #000;" v-bind:href="etherscanUrl+'/tx/'+post.txHash" target="_blank">
                                            <i class="fa fa-th-large" style="color: #000; margin: 5px;"></i>
                                            <ICountUp
                                                    :startVal="parseFloat(post.block) + parseFloat(post.blockAgo)"
                                                    :endVal="parseFloat(post.blockAgo)"
                                                    :decimals="decimalsLength(post.blockAgo)"
                                                    :duration="randomNumber(1,3)"
                                                    :options="countUp.options"
                                                    @ready="onReady"/>

                                        </a>
                                    </div>

                                    <!-- time ago with txid link to etherscan -->

                                    <div class="col-md col-xs-4 ellipsis" style="text-align: center;">
                                        <a style="color: #000;" v-bind:href="etherscanUrl+'/tx/'+post.txHash" target="_blank"><i class="fa fa-calendar-o" style="color: #000;"></i>&nbsp;
                                            <span class="text-dashboard"><b>{{ dateStringFormat(post.dateCreated)| moment("from", "now") }}</b></span></a>
                                    </div>

                                    <!-- rewards collected, align right -->
                                    <div class="col-md col-xs">
                                        <p class="text-right text-secondary ellipsis" style="margin-right: 5px;"><img
                                                src="../assets/images/LogoMarkColor.svg" width="20px" alt="">
                                            <b> {{ post.totalReward }} </b>
                                        </p>
                                    </div>
                                </div>
                            </li>
                        </ul>
                        <span v-else> No data to display </span>
                    </div>
                </div>

            </div>
            <div class="col-md-7 mb-3">
                <VIntelFeed :user="user" :updateContent="updateContentVar" :block="block"></VIntelFeed>
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

    export default {
        name: "VIntel",
        mixins: [countUpMixin],
        components: {
            ICountUp,
            VShimmerUser,
            VShimmerMyPost,
            VShimmerFeed,
            VIntelFeed
        },
        data: function () {
            return {
                address: null,
                loading: true,
                block: 0,
                modalWaiting: false,
                hardwareAvailable: false,
                rewardId: '',
                intelAddress: '',
                tokenAmount: 1,
                loadedMyContent: false,
                myContent: [],
                allMyContent: [],
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
            ...mapState(["madeLogin", "ws", "signType", "pathId", "pendingTransactions"])
        },
        methods: {
            ...mapMutations(["intelEnter", "iniWs"]),
            ...mapActions(["addTransaction", "transactionComplete", "assignTransactions", "editTransaction"]),
            clickTransaction: function(transaction){
                ContentService.pendingTransactionApproval(
                    transaction,
                    {signType: this.signType, pathId: this.pathId},
                    {

                        addTransaction : this.addTransaction,
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
                    });
            },
            creatorRoute(address) {
                return '/intel/' + address + '/';
            },
            dateStringFormat(date) {
                return new Date(date);
            },
            distributeReward: function (ID) {
                ContentService.distributeRewards(
                    {ID}, {signType: this.signType, pathId: this.pathId},
                    res => {
                        //  console.log(res);
                    },
                    error => {
                    }
                );
            },
            intelRoute(intel) {
                let param = (intel.txHash === '0x0') ? intel._id : intel.txHash;
                return '/intel/' + intel.address + '/' + param;
            },
            goToIntelPage: function () {
                window.location = '/#/create';
            },
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
            leaderboards(address){
                return '/leaderboards' + '?address=' + address;
            },
            loadAddress: function () {
                return dashboardService.getAddress(
                    res => {
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
            loadContent: function () {
                return dashboardService.getAllContent(null,
                    res => {
                    },
                    error => {
                    }
                );
            },
            updateContent: function () {
                return dashboardService.getAllContent(params,
                    res => {
                        this.loading = false;
                        this.myFeed.page++;
                        this.myFeed.loading = false;
                        this.myFeed.content = [...this.myFeed.content, ...res];
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
            numberToScientificNotation(number) {
                return (number + "").length > 12 ? number.toExponential(5) : number;
            },
            overrideOnMessage() {
                let wsa = this.ws;
                //console.log(this.ws)
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
                                    this.loadMyContent();
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
            loadProfileImage: function (pic) {
                let path = this.baseURL + "/profile-image?image=";
                return profileService.getProfileImage(path, pic);
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
                    this.loadMyContent(),
                    this.loadAddress(),
                    this.loadContent(),
                    this.getTransactions()
                ]).then(values => {
                    this.$store.state.makingRequest = false;
                });
            },
            scrollMyPost: function () {
                let list = document.getElementById("mypost");

                if (list.scrollTop + list.offsetHeight >= list.scrollHeight
                    && this.myContent.length < this.allMyContent.length) {
                    this.myContent = this.allMyContent.slice(0, this.myContent.length + 10);
                    // console.log(this.myContent);
                }
            },
            showModal() {
                this.$refs.myModalRef.show();
            },
            // substringTitle(title) {
            //     return (title.length > 35) ? title.substring(0, 35) + ' ...' : title;
            // },
            updatePicture: function () {
                let file = this.$refs.file.files[0];
                let formData = new FormData();
                formData.append("file", file);
                profileService.uploadProfilePic(formData, res => {
                    this.user.profile_pic = res;
                });
            },
            transactionStatus: function(status) {
                switch (status){
                    case 0:
                        return 'Pending Approval';
                    case 1:
                        return 'Approved';
                    case 2:
                        return 'Pending Reward';
                }
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
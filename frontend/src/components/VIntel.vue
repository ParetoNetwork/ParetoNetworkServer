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
                            <button class="btn btn-primary-pareto" @click="showModal">
                                EDIT PROFILE
                            </button>
                        </div>

                        <div class="media-body flex-column text-left mt-2 ellipsis">
                            <span class="name-title"><b>{{user.first_name|| ''}}  {{user.last_name || ''}}</b></span>
                            <p v-if="user.address" class="ellipsis"><b class="ellipsis"> {{user.address}} </b></p>
                            <div class="mt-2">
                                <img src="../assets/images/LogoMarkColor.svg" width="20px" alt="" class="mr-2">
                                <span class="title"><b>{{(user.tokens || '')}}<sup></sup></b></span>
                            </div>
                            <p class="mb-2 mt-2">
                                <b>Network Rank:&nbsp;</b>
                                <ICountUp
                                        :startVal="countUp.startVal"
                                        :endVal="parseFloat(user.rank)"
                                        :decimals="decimalsLength(user.rank)"
                                        :duration="randomNumber(3,6)"
                                        :options="countUp.options"
                                        @ready="onReady"/>
                            </p>
                            <p class="mb-2 mt-2">
                                <b>User Score:&nbsp;</b>
                                <ICountUp
                                        v-if="user.score"
                                        :startVal="countUp.startVal"
                                        :endVal="parseFloat(user.score)"
                                        :decimals="decimalsLength(user.score)"
                                        :duration="randomNumber(3,6)"
                                        :options="countUp.options"
                                        @ready="onReady"/>
                                <span v-else> 0 </span>
                            </p>

                            <!--<router-link tag="button" class="btn btn-primary-pareto" :to="'/calculator'">-->
                            <!--Calculate-->
                            <!--</router-link>-->
                            <!--<div class="d-flex flex-column" style="padding-left: 1.8rem;">-->

                            <!---->
                            <!--<div class="">-->
                            <!--<span class="subtitle-dashboard"><b>BIO:</b></span>-->
                            <!--<p class="text-dashboard text-pareto-gray">-->
                            <!--{{user.biography || 'No biography provided'}}-->
                            <!--</p>-->
                            <!--</div>-->
                            <!--</div>-->
                        </div>
                    </div>
                </template>

                <VShimmerMyPost v-if="!myContent.length && !loadedMyContent"></VShimmerMyPost>
                <div v-else class="border  mb-3 mb-md-1 px-2 px-md-4 py-3">
                    <div class="p-3 border-bottom d-flex justify-content-between align-items-center">
                        <h5 class="title"><b>EVENTS</b></h5>
                        <ul>
                            <div>
                                <p v-for="tx in pendingTransactions">{{tx.intel}} </p>
                            </div>
                        </ul>
                        <button v-if="false" class="btn btn-success-pareto button-margin" @click="goToIntelPage()">POST NEW INTEL
                        </button>
                    </div>
                    <div class="p-1 scrollable" id="mypost" v-on:scroll="scrollMyPost()">
                        <ul v-if="myContent.length" class="list-group list-unstyled">
                            <li class="list-group-item border-0 p-3" v-for="post in myContent" :key="post.id">
                                <router-link tag="div" class="split" :to="intelRoute(post)"
                                             @click="showDetails(post)">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div class="d-flex flex-column text-left">
                                            <h5 class="title"><b>{{post.title}}</b></h5>
                                            <span v-if="!post.validated"> Pending Blockchain Confirmation</span>
                                            <span>{{post.dateCreated | date}}</span>
                                        </div>
                                        <div class="d-flex ">
                                            <span class="underline text-primary ellipsis"><u><b>TXID:</b> {{post.txHash>7 ? post.txHash.slice(0,7):post.txHash }}</u></span>
                                        </div>
                                    </div>
                                </router-link>
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
                    <label for="first_name">First Name</label>
                    <div class="input-group mb-3">
                        <input v-model="firstName" type="text" class="form-control" id="first_name"
                               aria-describedby="basic-addon3">
                    </div>
                    <label for="last_name">Last Name</label>
                    <div class="input-group mb-3">
                        <input type="text" class="form-control" id="last_name" v-model="lastName"
                               aria-describedby="basic-addon3">
                    </div>
                    <label for="bio">Biography</label>
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
    import {mapMutations, mapState} from "vuex";
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
                block : 0,
                modalWaiting: false,
                hardwareAvailable: false,
                rewardId: '',
                intelAddress: '',
                tokenAmount: 1,
                loadedMyContent: false,
                myContent: [],
                allMyContent: [],
                moment: moment,
                firstName: "",
                lastName: "",
                bio: "",
                picture: "",
                baseURL: environment.baseURL,
                user: {
                    rank: 0,
                    score: 0,
                    tokens: 0
                },
                updateContentVar : 0
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
            ContentService.getTransactions();
        },
        computed: {
            ...mapState(["madeLogin", "ws", "signType", "pathId", "pendingTransactions"])
        },
        methods: {
            ...mapMutations(["intelEnter", "iniWs"]),
            distributeReward: function (ID) {
                ContentService.distributeRewards(
                    {ID},{signType: this.signType, pathId: this.pathId},
                    res => {
                        //  console.log(res);
                    },
                    error => {
                    }
                );
            },
            intelRoute(intel){
                let param = (intel.txHash === '0x0')? intel._id : intel.txHash;
                return '/intel/' + intel.address + '/' + param;
            },
            goToIntelPage: function () {
                window.location = '/#/create';
            },
            loadAddress: function () {
                return dashboardService.getAddress(
                    res => {
                        this.address = res;
                    },
                    error => {
                        let errorText= error.message? error.message : error;
                        this.$notify({
                            group: 'notification',
                            type: 'error',
                            duration: 10000,
                            title: 'Login',
                            text: errorText });
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
            updateContent: function(){
                return dashboardService.getAllContent(params,
                    res => {
                        this.loading = false;
                        this.myFeed.page++;
                        this.myFeed.loading = false;
                        this.myFeed.content = [...this.myFeed.content, ...res];
                    },
                    error => {
                        let errorText= error.message? error.message : error;
                        this.$notify({
                            group: 'notification',
                            type: 'error',
                            duration: 10000,
                            title: 'Content',
                            text: errorText });
                    }
                );
            },
            numberToScientificNotation(number){
                return (number+"").length>12? number.toExponential(5) : number;
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
                        if (info.data.action){
                            switch (info.data.action){
                                case 'updateContent':{
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
                        let errorText= error.message? error.message : error;
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
                        this.firstName = res.first_name;
                        this.lastName = res.last_name;
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
                    this.loadContent()
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
            updateProfile() {
                const profile = {
                    first_name: this.firstName,
                    last_name: this.lastName,
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
<template>
    <div class="container main  wrapp">
        <notifications group="auth" position="bottom right"/>
        <div class="row pt-5">
            <div class="col-md-5 mb-5 mt-2 m-sm-0">

                <template v-if="user">
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

                <div class="border  mb-3 mb-md-1 px-2 px-md-4 py-3">
                    <div class="p-3 border-bottom d-flex justify-content-between align-items-center">
                        <h5 class="title"><b>MY POSTS</b></h5>
                        <button class="btn btn-success-pareto button-margin" @click="goToIntelPage()">POST NEW INTEL
                        </button>
                    </div>
                    <div class="p-1 scrollable" id="mypost" v-on:scroll="scrollMyPost()">
                        <ul v-if="myContent.length" class="list-group list-unstyled">
                            <li class="list-group-item border-0 p-3" v-for="post in myContent" :key="post.id">
                                <router-link tag="div" class="split" :to="'/intel/' + post._id"
                                             @click="showDetails(post)">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div class="d-flex flex-column text-left">
                                            <h5 class="title"><b>{{post.title}}</b></h5>
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
            <div class="col-md-7">
                <div class="border p-2">
                    <div class="p-3 border-bottom">
                        <h5 class="title"> MY INTEL FEED: </h5>
                    </div>
                    <div v-if="loading" class="d-flex split">
                        <i class="fa fa-spinner fa-spin fa-5x mt-2 mx-auto">
                        </i>
                    </div>
                    <div v-if="!myFeed.content">
                        <span> No data to display </span>
                    </div>
                    <div class="scrollable" id="myfeed" v-on:scroll="scrollMyFeed()">
                        <ul class="list-unstyled list-group">
                            <li class="text-left list-group-item border-0 px-1" :key="row._id" v-for="row of myFeed.content">
                                <div class="d-flex split "
                                             @click="showDetails(row)">
                                    <div class="row" >
                                        <router-link tag="div" :to="'/intel/' + row._id" class="col-lg-8 col-xl-9 pr-0 d-flex justify-content-between">
                                            <div class="border p-1 mr-2" style="height: 50px;">
                                                <div data-v-514e8c24="" class="thumb"
                                                     v-bind:style="{ backgroundImage: 'url( ' + loadProfileImage(row.createdBy.profilePic)}"
                                                     style="width: 40px; height: 40px;"></div>
                                            </div>
                                            <div class="d-flex flex-column flex-grow-1 pr-0">
                                                <h1 class="title">{{row.title || 'No title'}}</h1>
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
                                        </router-link>

                                        <div class="col-10 col-lg-3 mx-lg-auto">
                                            <div v-if="false" class="text-right font-weight-bold">
                                                <img src="../assets/images/icon-mini.svg" alt="" class="icon-mini">
                                                <span class="text-right">{{row.pxt}}</span>
                                            </div>

                                            <div v-if="user.address != row.address" class="row ml-5 ml-lg-0 mt-2 mt-lg-0 mr-1">
                                                <div class="col-6 col-lg-12 p-1">
                                                    <b-btn class="btn-block" style="width: 120px;"
                                                           v-b-modal.modalToken @click="rewardId = row.id">REWARD</b-btn>
                                                </div>
                                                <div class="col-6 col-lg-12 p-1">
                                                    <button class="btn btn-primary-pareto btn-block" style="width: 120px;" @click="distributeReward(row.id)">
                                                        DISTRIBUTE
                                                    </button>
                                                </div>
                                            </div>
                                            <div v-else style="width: 300px">
                                            </div>
                                        </div>

                                    </div>

                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
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
                <p class="text-dashboard mb-2" style="font-size: 16px">  Please enter the number of Pareto Tokens to reward</p>
                <b-form-input v-model="tokenAmount" style="font-size: 25px"
                              type="number"></b-form-input>
                <b-row class="m-2 mt-4 d-flex justify-content-center">
                    <b-button class="mr-2" variant="danger" @click="hideModal()"> Cancel </b-button>
                    <b-button style="background-color: rgb(107, 194, 123)" variant="success" @click="rewardIntel(rewardId, tokenAmount)"> Confirm </b-button>
                </b-row>
            </b-container>
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

    import {mapMutations, mapState} from "vuex";
    import environment from "../utils/environment";
    import {countUpMixin} from "../mixins/countUp";

    export default {
        name: "VIntel",
        mixins: [countUpMixin],
        components: {
            ICountUp
        },
        data: function () {
            return {
                address: null,
                loading: true,
                myFeed: {
                    content: [],
                    loading: false,
                    page: 0,
                },
                rewardId : '',
                tokenAmount : 1,
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
                scrollPost: 0,
                scrollFeed: 0
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
            ...mapState(["madeLogin", "ws"])
        },
        methods: {
            ...mapMutations(["intelEnter", "iniWs"]),
            distributeReward: function (ID) {
                ContentService.distributeRewards(
                    {ID},
                    res => {
                      //  console.log(res);
                    },
                    error => {
                    }
                );
            },
            dateStringFormat(date){
                return new Date(date);
            },
            goToIntelPage: function () {
                window.location = '/#/create';
            },
            loadAddress: function () {
                return dashboardService.getAddress(
                    res => {
                        this.address = res;
                    },
                    () => {
                        this.$notify({
                            group: 'foo',
                            type: 'error',
                            duration: 10000,
                            text: 'There was an error loading the address. Please refresh the page'
                        });
                    }
                );
            },
            loadContent: function (params) {
                return dashboardService.getAllContent(params,
                    res => {
                        this.loading = false;
                        this.myFeed.page++;
                        this.myFeed.loading = false;
                        this.myFeed.content = [...this.myFeed.content, ...res];
                    },
                    error => {
                        this.$notify({
                            group: 'foo',
                            type: 'error',
                            duration: 10000,
                            text: 'There was an error loading the address. Please refresh the page'
                        });
                    }
                );
            },
            hideModal () {
                this.$refs.modalToken.hide()
            },
            assignBlock(block){
                this.myFeed.content = this.myFeed.content.map( item => {
                    // console.log(item);
                   item.blockAgo = block - item.block;
                    return item;
                });
            },
            overrideOnMessage(){
                let wsa = this.ws;
                console.log(this.ws)
                this.ws.onmessage = (data) => {
                    try {
                        const info = JSON.parse(data.data);
                        if (info.data.address) {
                            this.user.score = info.data.score;
                            this.user.rank = info.data.rank;
                            this.user.tokens = info.data.tokens;
                            // this.user.block = info.data.block;
                            this.assignBlock(info.data.block);
                        }

                    } catch (e) {
                        console.log(e);
                    }
                };
            },
            socketConnection () {
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
                }else{
                    this.overrideOnMessage();
                }
            },
            loadMyContent: function () {
                return dashboardService.getContent(
                    res => {
                        this.allMyContent = res;
                        this.myContent = this.allMyContent.slice(0, 10);
                    },
                    error => {
                        this.$notify({
                            group: 'foo',
                            type: 'error',
                            duration: 10000,
                            text: 'There was an error loading the address. Please refresh the page'
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
            rewardIntel: function (ID, tokenAmount) {
                this.hideModal();

                if (!tokenAmount){
                    this.$notify({
                        group: 'foo',
                        type: 'error',
                        duration: 10000,
                        text: 'No Token Amount'
                    });
                    this.tokenAmount = 1;
                    return;
                }

                console.log(ID, tokenAmount);
                ContentService.rewardIntel(
                    {ID, tokenAmount},
                    res => {
                      console.log(res);
                    },
                    err => {
                        console.log(res);
                    }
                );
            },
            scrollMyPost: function () {
                let list = document.getElementById("mypost");

                if (list.scrollTop + list.offsetHeight >= list.scrollHeight
                    && this.myContent.length < this.allMyContent.length) {
                    this.myContent = this.allMyContent.slice(0, this.myContent.length + 10);
                   // console.log(this.myContent);
                }
            },
            scrollMyFeed: function () {
                let list = document.getElementById("myfeed");

                if (list.scrollTop + list.offsetHeight >= list.scrollHeight * 0.9
                    && !this.myFeed.loading) {
                    const params = { limit: 10, page:  this.myFeed.page };
                    this.myFeed.loading = true;
                    this.loadContent(params);
                }
            },
            showDetails: function (row) {
                // console.log(row);
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
                            this.socketConnection ();
                            this.requestCall();
                        }
                    );
                } else {
                    this.socketConnection ();
                    this.requestCall();
                }
            }
        }
    };
</script>

<style scoped lang="scss">
    .container {
        font-family: "Body";
    }

    li > .split {
        cursor: pointer;
        border-bottom: 1px solid rgba(0, 0, 0, 0.125);
        padding-bottom: 0.5rem;
    }

    li,
    .list-group-item:last-child > .split {
        border-bottom: 0;
    }

    .name-title {
        font-size: 21px;
        font-weight: bold;
        font-style: normal;
        font-stretch: normal;
        line-height: normal;
        letter-spacing: normal;
        text-align: center;
        color: #020f1f;
    }

    .button-margin {
        margin-left: 15px;
    }

    .icon-mini {
        object-fit: contain;
        height: auto;
        margin-right: 5px;
    }

    .title {
        font-size: 18px;
        font-weight: bold;
        font-style: normal;
        font-stretch: normal;
        line-height: normal;
        letter-spacing: normal;
    }

    .text-dashboard {
        font-size: 11px;
        font-weight: normal;
        font-style: normal;
        font-stretch: normal;
        line-height: normal;
        letter-spacing: normal;
    }

    .scrollable {
        overflow: auto;
        scroll-behavior: smooth;
    }

    .subtitle-dashboard {
        font-size: 9px;
        font-weight: bold;
        font-style: normal;
        font-stretch: normal;
        line-height: normal;
        letter-spacing: normal;
        text-align: center;
    }

    .ellipsis {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        -o-text-overflow: ellipsis;
    }

    .wrapp {
        color: black;
        font-size: 12px;
    }

    #myfeed {
        max-height: 860px;
    }

    #mypost {
         max-height: 600px;
    }

    #wrapper {
        position: relative;
    }

    #wrapper .text {
        position: absolute;
        bottom: 0;
        display: none;
    }

    #wrapper:hover .text {
        display: flex;
        background: rgba(0, 0, 0, 0.5);
    }

    #wrapper:hover .text {
        display: flex;
        background: rgba(0, 0, 0, 0.5);
    }

</style>
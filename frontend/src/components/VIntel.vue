<template>
    <div class="container main  wrapp">
        <div class="row pt-5">
            <div class="col-md-5 mb-5 mt-2 m-sm-0">

                <template v-if="user">
                    <div class="media py-1 px-4 border mb-3 mb-md-5">
                        <div class="d-flex flex-column mr-2">
                            <div class="border p-2 mb-2" @click="openInput()">

                                <div data-v-514e8c24="" class="thumb" id="wrapper"
                                     v-bind:style="{ backgroundImage: 'url( ' + loadProfileImage(user.profile_pic)}"
                                     style="width: 100px; height: 100px;">
                                    <div class="text text-white justify-content-center align-items-center h-100 w-100"><span>Change Image <i class="fa fa-pencil"
                                                                                              aria-hidden="true"></i></span>
                                    </div>
                                </div>
                                <input type="file" class="d-none" id="file" ref="file" v-on:change="updatePicture()"/>
                            </div>
                            <button class="btn btn-primary-pareto" @click="showModal">
                                EDIT PROFILE
                            </button>
                        </div>

                        <div class="media-body flex-column text-left mt-2">
                            <span class="name-title"><b>{{user.first_name|| ''}}  {{user.last_name || ''}}</b></span>
                            <p v-if="user.address"><b> {{ user.address.slice(0,15) + '...'}} </b></p>
                            <div class="mt-2">
                                <img src="../assets/images/LogoMarkColor.svg" width="20px" alt="" class="mr-2">
                                <span class="title"><b>{{(user.tokens || '') + 'PARETO'}}<sup></sup></b></span>
                            </div>
                            <p class="mb-2 mt-2"><b>Network Rank:</b> {{user.rank || ''}}</p>


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

                <div class="border  mb-3 mb-md-1">
                    <div class="p-3 border-bottom">
                        <span class="title"> <b>MY POSTS:</b> </span>
                        <button v-if="false" class="btn btn-success-pareto">POST NEW INTEL</button>
                    </div>
                    <div class="p-3">
                        <ul v-if="myContent.length" class="list-group list-unstyled">
                            <li class="list-group-item border-0" v-for="post in myContent" :key="post.id">
                                <div class="d-flex justify-content-between split align-items-center">
                                    <div class="d-flex flex-column text-left">
                                        <h5><b>{{post.title}}</b></h5>
                                        <span>{{post.date | date}}</span>
                                    </div>
                                    <div class="d-flex ">
                                        <span class="underline text-primary"><u><b>TXID:</b> {{post.trd}}</u></span>
                                    </div>
                                </div>

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
                    <div class="">
                        <ul class="list-unstyled list-group">
                            <li class="text-left list-group-item border-0 px-1" :key="row._id" v-for="row of content">
                                <router-link tag="div" class="d-flex split" :to="'/intel/' + row._id" @click="showDetails(row)">
                                    <div class="border p-1 mr-2">
                                        <div data-v-514e8c24="" class="thumb"
                                             v-bind:style="{ backgroundImage: 'url( ' + loadProfileImage(row.createdBy.profilePic)}"
                                             style="width: 40px; height: 40px;"></div>
                                    </div>
                                    <!--<img v-if="row.createdBy.profilePic" width="50" height="50" v-bind:src="baseURL+ '/profile-image?image=' + row.createdBy.profilePic" alt="" class="image-fit mr-2 border p-2">-->
                                    <!--<img v-else width="50" height="50" src="../assets/images/user_placeholder.png" alt="" class="image-fit mr-2 border p-2">-->

                                    <div class="d-flex justify-content-between flex-grow-1">
                                        <div class="d-flex flex-column flex-grow-1 pr-5">
                                            <h1 class="title">{{row.title || 'No title'}}</h1>
                                            <div class="d-flex justify-content-between">
                                                <span v-if="false" class="text-dashboard">Rewarded {{row.rewarded}} Times</span>
                                                <span class="text-dashboard">Disclosed by: {{row.address}} at block {{row.blockAgo}} </span>
                                            </div>
                                        </div>
                                        <div class="d-flex flex-column justify- content-end">
                                            <div v-if="false" class="text-right font-weight-bold">
                                                <img src="../assets/images/icon-mini.svg" alt="" class="icon-mini">
                                                <span class="text-right">{{row.pxt}}</span>
                                            </div>
                                            <button class="btn btn-primary-pareto" v-if="false">REWARD</button>
                                        </div>
                                    </div>

                                </router-link >
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
    </div>
</template>

<script>
    import dashboardService from '../services/dashboardService';
    import profileService from '../services/profileService';
    import moment from 'moment';
    import AuthService from '../services/authService';

    import {mapMutations, mapState} from 'vuex';
    import environment from '../utils/environment';
    import http from '../services/HttpService';

    export default {
        name: 'VIntel',
        components: {},
        data: function () {
            return {
                address: null,
                content: [
                    ], myContent: [
                    ],
                loading: true,
                moment: moment,
                firstName: '',
                lastName: '',
                bio: '',
                picture: '',
                baseURL: environment.baseURL,
                user: {}
            };
        }, filters: {
            date: function formatDate(date) {
                const temp = moment(date);
                return temp.format('MMMM Do, YYYY');
            }
        },
        mounted: function () {
            this.main();
        }, computed: {
            ...mapState(['madeLogin'])
        },
        methods: {
            ...mapMutations(['intelEnter']),
            loadAddress: function () {
                return dashboardService.getAddress(res => {
                    this.address = res;
                }, () => {
                    // alert(error);
                });
            }, openInput: function () {
                document.getElementById('file').click();
            }, updatePicture: function () {
                let file = this.$refs.file.files[0];
                let formData = new FormData();
                formData.append('file', file);
                profileService.uploadProfilePic(formData, res => {
                    this.user.profile_pic = res;
                });
            },
            showDetails: function(row){
               // console.log(row);
            },
            loadProfileImage: function(pic){
                let path = this.baseURL + '/profile-image?image=';
                return profileService.getProfileImage(path, pic);
            },
            loadContent: function () {
                return dashboardService.getAllContent(res => {
                    this.loading = false;
                    this.content = res;
                }, error => {
                    alert(error);
                });
            }, loadProfile: function () {
                return profileService.getProfile(res => {
                    this.user = res;
                   // console.log(this.user);
                    this.firstName = res.first_name;
                    this.lastName = res.last_name;
                    this.bio = res.biography;
                }, () => {

                });
            },
            loadMyContent: function () {
                return dashboardService.getContent(res => {
                    this.myContent = res;
                }, error => {
                    alert(error);
                });
            },
            showModal() {
                this.$refs.myModalRef.show();
            },
            updateProfile() {
                const profile = {
                    'first_name': this.firstName,
                    'last_name': this.lastName,
                    'biography': this.bio
                };
                profileService.updateProfile(profile, res => {
                    this.$refs.myModalRef.hide();
                    this.loadProfile();
                }, error => {

                });
            },
            requestCall : function(){
                Promise.all([
                    this.loadProfile(),
                    this.loadMyContent(),
                    this.loadAddress(),
                    this.loadContent()
                ]).then( values => {
                    this.$store.state.makingRequest = false;
                });
            },
            main: function () {
                this.$store.state.makingRequest = true;
                if (!this.madeLogin) {
                    this.intelEnter();
                    AuthService.postSign(() => {
                        this.requestCall();
                    }, () => {
                        this.requestCall();
                    });
                } else {
                    this.requestCall();
                }
            }
        }
    }
    ;
</script>

<style scoped lang="scss">

    .container{
        font-family: 'Body';
    }

    .wrapp {
        color: black;
        font-size: 12px;
    }

    li > .split {
        cursor: pointer;
        border-bottom: 1px solid rgba(0, 0, 0, 0.125);
        padding-bottom: 0.5rem;

    }

    li, .list-group-item:last-child > .split {
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

    .subtitle-dashboard {
        font-size: 9px;
        font-weight: bold;
        font-style: normal;
        font-stretch: normal;
        line-height: normal;
        letter-spacing: normal;
        text-align: center;
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
        background: rgba(0,0,0,0.5);
    }
</style>
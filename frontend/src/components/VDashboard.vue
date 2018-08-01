<template>
    <div class="container main  wrapp">
        <div class="row pt-5">
            <div class="col-md-5">

                <template v-if="user">
                    <div class="media py-1 px-4 border mb-5">
                        <div class="d-flex flex-column mr-2">
                            <div class="border p-2 mb-2" @click="openInput()">
                                <div id="wrapper">
                                    <img width="100" v-bind:src="baseURL+ '/profile-image?image=' + user.profile_pic"
                                         alt=""
                                         v-if="user.profile_pic">
                                    <span v-else style="font-size: 50px;  color: gray; background: #b2b2b2"
                                          class="fa fa-user p-2"></span>
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


                        <div class="media-body flex-column text-left">
                            <span class="name-title"><b>{{user.first_name|| ''}}  {{user.last_name || ''}}</b></span>
                            <div class="">

                                <img src="../assets/images/LogoMarkColor.svg" width="20px" alt="" class="mr-2">
                                <span class="title"><b>{{(user.tokens || '') + 'PARETO'}}<sup></sup></b></span></div>
                            <div class="d-flex flex-column" style="padding-left: 1.8rem;">

                                <span class="mb-3 text-dashboard text-pareto-gray"><b>NETWORK RANKING:</b> {{user.rank || ''}}</span>
                                <div class="">
                                    <span class="subtitle-dashboard"><b>BIO:</b></span>
                                    <p class="text-dashboard text-pareto-gray">
                                        {{user.biography || 'No biography provided'}}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>

                <div class="border">
                    <div class="p-3 border-bottom">
                        <span> <b>MY POSTS:</b> </span>
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
                    <h5 class="text-left"> MY INTEL : </h5>
                    <div v-if="loading" class="d-flex split">
                            <i class="fa fa-spinner fa-spin fa-5x mt-2 mx-auto">
                            </i>
                    </div>
                    <div class="">
                        <ul class="list-unstyled list-group">
                            <li class="text-left list-group-item border-0 px-1" :key="row._id" v-for="row of content">
                                <router-link tag="div" class="d-flex split" :to="'/dashboard/' + row._id" @click="showDetails(row)">
                                    <img width="50" height="50" src="../assets/logo.png" alt="" class="mr-2 border p-2">
                                    <div class="d-flex justify-content-between flex-grow-1">
                                        <div class="d-flex flex-column flex-grow-1 pr-5">
                                            <h1 class="title">{{row.title || 'No title'}}</h1>
                                            <div class="d-flex justify-content-between">
                                                <span v-if="false" class="text-dashboard">Rewarded {{row.rewarded}} Times</span>
                                                <span class="text-dashboard">Posted By: {{row.address}}</span>
                                                <span class="text-dashboard">{{row.block}} Blocks Ago</span>
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

    export default {
        name: 'VDashboard',
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
            this.baseURL = environment.baseURL;
        }, computed: {
            ...mapState(['madeLogin'])
        },
        methods: {
            ...mapMutations(['intelEnter']),
            loadAddress: function () {
                dashboardService.getAddress(res => {
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
                console.log(row);
            }
            ,
            loadContent: function () {
                dashboardService.getAllContent(res => {
                    this.loading = false;
                    this.content = res;
                }, error => {
                    alert(error);
                });
            }, loadProfile: function () {
                profileService.getProfile(res => {
                    this.user = res;
                    this.firstName = res.first_name;
                    this.lastName = res.last_name;
                    this.bio = res.biography;
                }, () => {

                });
            }
            ,
            loadMyContent: function () {
                dashboardService.getContent(res => {
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
            }
            ,
            main: function () {
                if (!this.madeLogin) {
                    this.intelEnter();

                    AuthService.postSign(() => {
                        this.loadProfile();
                        this.loadMyContent();

                        this.loadContent();
                    }, () => {
                        this.loadProfile();
                        this.loadContent();
                        this.loadMyContent();
                    });
                } else {
                    this.loadProfile();
                    this.loadContent();
                    this.loadMyContent();
                }

            }
        }
    }
    ;
</script>

<style scoped lang="scss">
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
        font-size: 10px;
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
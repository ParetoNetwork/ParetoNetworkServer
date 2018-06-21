<template>
    <div class="container main  wrapp">
        <div class="row pt-5">
            <div class="col-md-5">

                <template v-if="address">
                    <div class="media py-1 px-4 border mb-5 align-items-center">
                        <div class="d-flex flex-column">
                            <div class="border p-2 mb-2 mr-2">
                                <span style="font-size: 50px;  color: gray; background: #b2b2b2"
                                      class="fa fa-user p-2"></span>

                            </div>
                            <button class="btn btn-primary" @click="showModal">
                                EDIT PROFILE
                            </button>
                        </div>


                        <div class="media-body flex-column text-left">
                            <span>Bryce Waldorf</span>

                            <div class="">
                                <img src="../assets/images/LogoMarkColor.svg" width="20px" alt="">
                                <span class="text"><b>3700</b></span>
                                <div class="pl-2">
                                    <span>NETWORK RANKING: {{300}}</span>
                                    <span><b>BIO:</b></span>
                                    <p>

                                    </p>
                                </div>
                            </div>
                            <span>{{'Network Rank ' + address.rank}}</span>
                        </div>
                    </div>
                </template>

                <div class="border">
                    <div class="d-flex justify-content-between align-items-center p-3 mb-3">
                        <span>MY POSTS: </span>
                        <button class="btn btn-success">POST NEW INTEL</button>
                    </div>
                    <div class="">
                        <ul class="list-group list-unstyled">
                            <li class="list-group-item border-0" v-for="post in myContent" :key="post.id">
                                <div class="d-flex justify-content-between split align-items-center">
                                    <div class="d-flex flex-column text-left">
                                        <h5><b>{{post.title}}</b></h5>
                                        <span>{{post.date | date}}</span>
                                    </div>
                                    <div class="">
                                        <span class="underline text-primary"><u><b>TXID:</b> {{post.trd}}</u></span>
                                    </div>
                                </div>

                            </li>
                        </ul>
                    </div>
                </div>
                <!--<table class="table border">-->
                <!--<thead>-->
                <!--<th>MY POSTS</th>-->
                <!--</thead>-->
                <!--<tbody class="p-3">-->

                <!--<template v-if="!myContent.length">-->
                <!--<tr>-->
                <!--<td>-->
                <!--<span>No data to display</span>-->
                <!--</td>-->
                <!--</tr>-->
                <!--</template>-->
                <!--<tr :key="row._id" v-for="row of myContent">-->
                <!--<td class="text-left">-->
                <!--<b> {{row.title }}</b><br/>-->
                <!--<div style="font-size: 12px;">Disclosed by: {{row.address }} <span v-if="row.alias">({{row.alias}})</span>-->
                <!--at block-->
                <!--{{row.block}}-->
                <!--</div>-->
                <!--<br/>-->
                <!--<div class="" v-html="row.body"></div>-->
                <!--</td>-->
                <!--</tr>-->
                <!--</tbody>-->
                <!--</table>-->

            </div>
            <div class="col-md-7">
                <div class="border">
                    <span></span>
                    <table class="table table-responsive">
                        <thead>
                        <tr>
                            <th>MY INTEL FEED</th>
                        </tr>
                        </thead>
                        <tbody>
                        <template v-if="loading">
                            <tr>
                                <td>
                                    <span>Loading...</span>
                                </td>
                            </tr>
                        </template>
                        <tr :key="row._id" v-for="row of content">
                            <td class="text-left p-3">
                                <b> {{row.title }}</b><br/>
                                <div style="font-size: 12px;">Disclosed by: {{row.address}} <span v-if="row.alias">({{row.alias}})</span>
                                    at block
                                    {{row.block}}
                                </div>
                                <br/>
                                <div v-html="row.body"></div>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        <b-modal ref="myModalRef" title="Edit Profile" ok-title="Update" @ok="updateProfile">
            <div class="d-block text-center">
                <form action="">
                    <label for="first_name">First Name</label>
                    <div class="input-group mb-3">
                        <input v-model="firstName" type="text" class="form-control" id="first_name" aria-describedby="basic-addon3">
                    </div>
                    <label for="last_name">Last Name</label>
                    <div class="input-group mb-3">
                        <input  type="text" class="form-control" id="last_name"  v-model="lastName" aria-describedby="basic-addon3">
                    </div>
                    <label for="bio">Biography</label>
                    <div class="input-group mb-3">
                        <textarea v-model="bio" class="form-control" id="bio" aria-describedby="basic-addon3"> </textarea>
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

    export default {
        name: 'VDashboard',
        components: {},
        data: function () {
            return {
                address: null,
                content: [],
                myContent: [{title: 'title', date: new Date(), trd: 1231212312, id: 1}, {
                    title: 'title',
                    date: new Date(),
                    trd: 1231212312,
                    id: 2
                }],
                loading: true,
                moment: moment,
                firstName: '',
                lastName:'',
                bio:'',
                picture:''
            }
                ;
        }, filters: {
            date: function formatDate(date) {
                const temp = moment(date);
                return temp.format('MMMM Do, YYYY');
            }
        },
        mounted: function () {
            this.loadAddress();
            this.loadContent();
        },
        methods: {
            loadAddress: function () {
                dashboardService.getAddress(res => {
                    this.address = res;

                }, () => {
                    // alert(error);
                });
            }, loadContent: function () {
                dashboardService.getAllContent(res => {
                    this.loading = false;
                    this.content = res;
                }, error => {
                    alert(error);
                });
            }, loadMyContent: function () {
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
                    "first_name": this.firstName,
                    "last_name": this.lastName,
                    "biography": this.bio
                };
                profileService.updateProfile(profile,res => {
                    this.$refs.myModalRef.hide()
                }, error => {

                })
            }
        }
    };
</script>

<style scoped lang="scss">
    .wrapp {
        color: black;
        font-size: 12px;
    }

    li > .split {

        border-bottom: 1px solid rgba(0, 0, 0, 0.125);
        padding-bottom: 0.5rem;

    }

    li, .list-group-item:last-child > .split {
        border-bottom: 0;

    }
</style>
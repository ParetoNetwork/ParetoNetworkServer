<template>
    <div class="main wrapp">
        <div class="container">
            <div class="row mx-2 pt-5">
                <div class="col-12 order-last order-lg-first col-lg-4 mb-4 p-0">
                    <div class="row">
                        <div class="col-12 col-sm-5 col-md-12 mb-2 mb-sm-0 mb-lg-5 border py-3">

                            <div data-v-514e8c24="" class="thumb profile-pic"
                                 v-bind:style="{ backgroundImage: 'url( ' + loadProfileImage( profile.profile_pic)}"
                                 ></div>
                            <!--<div class="media mb-3 w-100">-->
                                <!--&lt;!&ndash;<div class="d-flex flex-column m-auto">&ndash;&gt;-->
                                    <!--&lt;!&ndash;&lt;!&ndash;<span  style="font-size: 320px; color: gray; background: #b2b2b2"&ndash;&gt;&ndash;&gt;-->
                                    <!--&lt;!&ndash;&lt;!&ndash;class="fa fa-user p-2"></span>&ndash;&gt;&ndash;&gt;-->
                                    <!--&lt;!&ndash;&lt;!&ndash;<img v-if="profile.profile_pic" v-bind:src="baseURL+ '/profile-image?image=' + profile.profile_pic" width="100%" height="200px" alt="" class="mr-2 image-fit">&ndash;&gt;&ndash;&gt;-->
                                    <!--&lt;!&ndash;&lt;!&ndash;<img v-else src="../assets/images/user_placeholder.png"  width="100%" height="200px"  alt="" class="mr-2 image-fit">&ndash;&gt;&ndash;&gt;-->

                                <!--&lt;!&ndash;</div>&ndash;&gt;-->

                                <!---->
                            <!--</div>-->
                        </div>

                        <div class="col-12 col-sm-7 col-md-12 border p-5">
                            <div class="row text-group">
                                <h6 v-if="profile.first_name || profile.last_name" class="subtitle-dashboard" ><b> About {{profile.first_name}} {{profile.last_name}} :</b></h6>
                                <h6 v-else class="subtitle-dashboard" ><b> About {{profile.address}}:</b></h6>
                            </div>
                            <div class="row text-group">
                                <p v-if="profile.biography"> {{profile.biography}} </p>
                                <p v-else> No Bio to show </p>
                            </div>
                            <div class="row mt-4">
                                <img src="../assets/images/LogoMarkColor.svg" width="20px" height="20px" alt="" class="mr-2">
                                <span class="text-dashboard text-pareto-gray"><b>NETWORK RANKING:</b> {{profile.rank}} </span>
                            </div>

                            <div v-if="false" class="row border-bottom mt-5 px-0 py-3">
                                <i class="fa fa-search"></i>
                                <div class="m-auto">
                                    <span class="text-pareto-gray ml-3"> View Author Profile </span>
                                </div>
                            </div>
                            <div v-if="false" class="row border-bottom mt-3 px-0 py-3">
                                <i class="fa fa-book"></i>
                                <div class="m-auto">
                                    <span class="text-pareto-gray ml-3"> View Author's Articles </span>
                                </div>
                            </div>
                        </div>
                        <!--<button class="btn btn-success-pareto mt-5">-->
                            <!--<span class="px-4 subtitle-dashboard">REWARD AUTHOR</span>-->
                        <!--</button>-->
                    </div>
                </div>

                <div v-if="loading" class="col-12 col-lg-7 p-0">
                    <div class="row">
                        <div class="d-flex split mt-4 mx-auto">
                            <i class="fa fa-spinner fa-spin fa-5x">
                            </i>
                        </div>
                    </div>
                </div>
                <div v-else class="col-12 col-lg-7 offset-lg-1 mb-4 p-0">
                    <div class="row text-group">
                        <div class="col-12 border p-4">
                            <div class="row py-4 border-bottom m-0">
                                <div class="col-md-10 p-0">
                                    <span class="name-title"> {{intel.title}} </span>
                                </div>
                                <div class="col-md-2 p-0">
                                    <div class="d-flex flex-column align-items-end ">
                                        <span v-if="profile.first_name || profile.last_name" class="subtitle-dashboard" ><b> {{profile.first_name}} {{profile.last_name}} </b></span>
                                        <span v-else class="subtitle-dashboard" ><b> {{profile.address.slice(0,15) + '...'}} </b></span>
                                        <span class="mb-2"> {{ intel.blockAgo }} Blocks Ago </span>
                                        <span v-if="false" class="text-dashboard text-pareto-gray"> REWARDED {{intel.reward}} TIMES </span>
                                    </div>
                                </div>
                            </div>
                            <div class="text-group mt-4">
                                <p v-html="intel.body"> </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div>
</template>
<script>
    import DashboardService from '../services/dashboardService';
    import ProfileService from '../services/profileService';
    import environment from '../utils/environment';

    export default {
        name: 'VIntelDetail',
        data: function () {
            return {
                id: this.$route.params.id,
                loading: true,
                intel: {},
                address : {},
                profile: {
                    address: '',
                    first_name: '' ,
                    last_name: '',
                    biography: '',
                    rank: 1000
                },
                baseURL : environment.baseURL
            };
        },
        beforeMount: function () {
            this.$store.state.makingRequest = true;
            this.requestCall()
        },
        methods: {
            getIntel: function () {
                return DashboardService.getIntel(res => {
                   this.getProfile(res.address);
                   this.intel = res;
                }, error => {
                }, this.id);
            },

            getProfile: function (address) {
                ProfileService.getSpecificProfile( res => {
                    this.profile = res;
                    this.loading = false;
                }, error => {
                }, address)
            },
            loadProfileImage: function(pic){
                let path = this.baseURL + '/profile-image?image=';
                return ProfileService.getProfileImage(path, pic);
            },
            getAddress: function () {
                return DashboardService.getAddress(res => {
                    this.address = res;
                }, () => {
                    // alert(error);
                });
            },
            requestCall : function(){
                Promise.all([
                    this.getIntel(),
                    this.getAddress()
                ]).then( values => {
                    this.$store.state.makingRequest = false;
                });
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
        cursor: pointer;
        border-bottom: 1px solid rgba(0, 0, 0, 0.125);
        padding-bottom: 0.5rem;

    }

    li, .list-group-item:last-child > .split {
        border-bottom: 0;

    }

    .text-group{
        text-align: left;
    }

    .text-group-right{
        text-align: right;
    }

    .name-title {
        font-size: 25px;
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
        font-size: 10px;
        font-weight: bold;
        font-style: normal;
        font-stretch: normal;
        line-height: normal;
        letter-spacing: normal;
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

    @media (max-width: 992px){
        .profile-pic {
            width: 200px;
            height: 200px;
        }
    }

    @media (min-width: 992px){
        .profile-pic {
            width: 300px;
            height: 300px;
        }
    }
</style>
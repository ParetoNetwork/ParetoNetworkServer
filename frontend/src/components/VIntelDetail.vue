<template>
    <div class="main wrapp">
        <div class="container">
            <div class="row  pt-5">
                <div class="col-md-3">
                    <div class="row">
                        <div class="media p-3 border mb-3 w-100">
                            <div class="d-flex flex-column">
                                <!--<span  style="font-size: 320px; color: gray; background: #b2b2b2"-->
                                      <!--class="fa fa-user p-2"></span>-->
                                <img v-if="profile.profile_pic" src="profile.profile_pic" width="100%" height="200px" alt="" class="mr-2">
                                <img v-else src="../assets/images/user_placeholder.png" width="100%" height="200px" alt="" class="mr-2">
                            </div>
                        </div>
                    </div>
                    <div class="row border p-5">
                        <div class="text-group">
                            <h6 v-if="profile.first_name || profile.last_name" class="subtitle-dashboard" ><b> About {{profile.first_name}} {{profile.last_name}} :</b></h6>
                            <h6 v-else class="subtitle-dashboard" ><b> About {{profile.address.slice(0,15) + '...'}} :</b></h6>

                            <p v-if="profile.biography"> {{profile.biography}} </p>
                            <p v-else> No Bio to show </p>
                        </div>
                        <div class="mt-2">
                            <img src="../assets/images/LogoMarkColor.svg" width="20px" alt="" class="mr-2">
                            <span class="mb-3 text-dashboard text-pareto-gray"><b>NETWORK RANKING:</b> {{profile.rank}} </span>
                        </div>
                        <button class="btn btn-success-pareto mt-5">
                            <span class="px-4 subtitle-dashboard">REWARD AUTHOR</span>
                        </button>
                        <div class="border-bottom mt-3 p-2">
                            <i class="fa fa-search"></i> <span class="text-pareto-gray ml-3"> View Author Profile </span>
                        </div>
                        <div class="border-bottom mt-3 p-2">
                            <i class="fa fa-book"></i> <span class="text-pareto-gray ml-3"> View Author's Articles </span>
                        </div>
                    </div>
                </div>

                <div v-if="loading" class="col-md-9 ">
                    <div class="row">
                        <div class="d-flex split mt-4 mx-auto">
                            <i class="fa fa-spinner fa-spin fa-5x">
                            </i>
                        </div>
                    </div>
                </div>
                <div v-else class="col-md-9 mb-4">
                    <div class="row text-group ml-4">
                        <div class="border p-4">
                            <div class="row py-4 border-bottom m-0">
                                <div class="col-md-10 p-0">
                                    <span class="name-title"> {{intel.title}} </span>
                                </div>
                                <div class="col-md-2 p-0">
                                    <div class="text-group-right">
                                        <h6 v-if="profile.first_name || profile.last_name" class="subtitle-dashboard" ><b> {{profile.first_name}} {{profile.last_name}} </b></h6>
                                        <h6 v-else class="subtitle-dashboard" ><b> {{profile.address.slice(0,15) + '...'}} </b></h6>
                                        <p> {{intel.block}} Blocks Ago... </p>
                                        <span class="text-dashboard text-pareto-gray"> REWARDED {{intel.reward}} TIMES </span>
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

    export default {
        name: 'VIntelDetail',
        data: function () {
            return {
                id: this.$route.params.id,
                loading: true,
                intel: {},
                profile: {
                    address: '',
                    first_name: '' ,
                    last_name: '',
                    biography: '',
                    rank: 1000
                }
            };
        },
        beforeMount: function () {
            this.getIntel();
        },
        methods: {
            getIntel: function () {
                DashboardService.getIntel(res => {
                   this.getProfile(res.address);
                   this.intel = res;
                   console.log(res);
                }, error => {
                    console.log(error);
                }, this.id);
            },

            getProfile: function (address) {
                ProfileService.getSpecificProfile( res => {
                    this.profile = res;
                    this.loading = false;
                    console.log(res);
                }, error => {
                    console.log(error);
                }, address)
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
        font-size: 10px;
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
</style>
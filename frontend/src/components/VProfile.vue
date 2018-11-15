<template>
    <div>
        <div v-if="profile.address" class="row">
            <div class="col-12 col-sm-5 col-md-12 mb-2 mb-sm-0 mb-lg-5 border py-3">
                <router-link tag="div" class="cursor-pointer" :to="creatorRoute(profile.address)">
                    <div class="thumb profile-pic"
                         v-bind:style="{ backgroundImage: 'url( ' + loadProfileImage(profile.profile_pic)}"
                    ></div>
                </router-link>
            </div>
            <div class="col-12 col-sm-7 col-md-12 border p-5">
                <div class="row text-group">
                    <h6 v-if="profile.alias" class="subtitle-dashboard" ><b> About {{profile.alias}} :</b></h6>
                    <h6 v-else class="subtitle-dashboard" ><b> About {{profile.address}}:</b></h6>
                </div>
                <div class="row text-group">
                    <p v-if="profile.biography"> {{profile.biography}} </p>
                    <p v-else> No Bio to show </p>
                </div>


                <div class="row border-bottom mt-5 px-0 py-3">
                    <router-link tag="div" class="cursor-pointer" :to="creatorRoute(profile.address)">
                        <i class="fa fa-book"></i>
                        <span class="text-pareto-gray ml-3"> View Contributor Feed </span>
                    </router-link>
                </div>
                <router-link tag="div" class="cursor-pointer" :to="leaderboards(profile.address)">
                    <div class="row mt-2">
                        <div class="col-md col-xs mb-2 ellipsis text-left">
                            <i class="fa fa-area-chart" style="color: #4e555b; margin: 2px;"></i>
                            <i class="fa fa-globe" style="color: #1f69c0; margin: 2px;"></i>
                            <ICountUp
                                    :startVal="countUp.startVal"
                                    :endVal="parseFloat(profile.rank)"
                                    :decimals="decimalsLength(profile.rank)"
                                    :duration="randomNumber(3,6)"
                                    :options="countUp.options"
                                    @ready="onReady"/>
                        </div>
                        <!-- score, star for score, earn more stars for a greater score -->
                        <div class="col-md col-xs mb-2 ellipsis text-right">
                            <i class="fa fa-star" style="color: #fca130; margin: 2px;"></i>
                            <ICountUp
                                    v-if="profile.score"
                                    :startVal="countUp.startVal"
                                    :endVal="parseFloat(profile.score)"
                                    :decimals="decimalsLength(profile.score)"
                                    :duration="randomNumber(3,6)"
                                    :options="countUp.options"
                                    @ready="onReady"/>
                            <span v-else> 0 </span>
                        </div>
                    </div>
                </router-link>
            </div>
            <!--<button class="btn btn-success-pareto mt-5">-->
            <!--<span class="px-4 subtitle-dashboard">REWARD AUTHOR</span>-->
            <!--</button>-->
        </div>
        <VShimmerUserProfile v-else></VShimmerUserProfile>
    </div>

</template>

<script>
    import ProfileService from '../services/profileService';

    import ICountUp from 'vue-countup-v2';
    import {mapMutations, mapState} from "vuex";
    import {countUpMixin} from "../mixins/countUp";
    import environment from '../utils/environment';

    import VShimmerUserProfile from "./Shimmer/IntelDetailView/VShimmerUserProfile";

    export default {
        name: "VProfile",
        mixins: [countUpMixin],
        props: [
            'addressProfile'
        ],
        components: {
            ICountUp,
            VShimmerUserProfile
        },
        beforeMount: function () {
            if(this.addressProfile){
                this.getProfile(this.addressProfile);
            }
        },
        data: function () {
            return {
                profile: {
                    address: '',
                    alias: '' ,
                    biography: '',
                    rank: 1000
                },
                baseURL : environment.baseURL,
            }
        },
        methods: {
            creatorRoute(address) {
                return '/intel/' + address + '/';
            },
            getProfile: function (address) {
                ProfileService.getSpecificProfile( res => {
                    console.log(res);
                    this.profile = res;
                    this.loading = false;
                }, error => {
                }, address)
            },
            leaderboards(address){
                return '/leaderboards' + '?address=' + address;
            },
            loadProfileImage: function(pic){
                let path = this.baseURL + '/profile-image?image=';
                return ProfileService.getProfileImage(path, pic);
            },
        },
        watch: {
            addressProfile: function (newVal) {
                console.log(newVal);
                this.getProfile(newVal);
            }
        }
    }
</script>

<style scoped>
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
</style>
<template>
    <div v-if="profile.address" class="pareto-blue-dark text-center text-lg-left">
            <router-link tag="div" class="thumb profile-pic cursor-pointer"
                 v-bind:style="{ backgroundImage: 'url( ' + loadProfileImage(profile.profile_pic, profile.address)}"
                 :to="creatorRoute(profile.aliasSlug || profile.address)"
            ></router-link>
        <div class="mt-4">
            <p class="subtitle-user-content" ><b> {{profile.alias || profile.address.substring(0,10) + '...'}} :</b></p>
            <p class="text-user-content mt-2"> {{profile.biography || 'No Bio to show'}} </p>
            <div class="row cursor-pointer mt-3" >
                <div class="ml-0 col ellipsis">
                    <i class="fa fa-book green-color" style="margin-left: -15px"></i>
                    <router-link tag="span"  :to="creatorRoute(profile.aliasSlug || profile.address)" class="d-inline-block pl-1"> {{profile.address}} </router-link>
                </div>
            </div>
        </div>
        <div class="row justify-content-center justify-content-lg-start m-0 text-center mt-4">
            <router-link tag="div" class="cursor-pointer border p-2" :to="leaderboards(profile.address)">
                <p class="subtitle-user-content">
                    <ICountUp
                            :startVal="countUp.startVal"
                            :endVal="parseFloat(profile.rank)"
                            :decimals="decimalsLength(profile.rank)"
                            :duration="randomNumber(3,6)"
                            :options="countUp.options"
                            @ready="onReady"/>
                </p>
                <p> My Rank </p>
            </router-link>
            <router-link tag="div" class="cursor-pointer border ml-5 ml-lg-2 ml-xl-4 p-2" :to="leaderboards(profile.address)" style="min-width: 80px">
                <div class="mb-1">
                    <i class="fa fa-star green-color fa-lg"></i>
                </div>
                <ICountUp
                        v-if="profile.score"
                        :startVal="countUp.startVal"
                        :endVal="parseFloat(profile.score)"
                        :decimals="decimalsLength(profile.score)"
                        :duration="randomNumber(3,6)"
                        :options="countUp.options"
                        @ready="onReady"/>
                <span v-else> 0 </span>
            </router-link>
        </div>
        <!--<button class="btn btn-success-pareto mt-5">-->
        <!--<span class="px-4 subtitle-dashboard">REWARD AUTHOR</span>-->
        <!--</button>-->
    </div>
    <VShimmerUserProfile v-else></VShimmerUserProfile>


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
            'addressProfile', 'profileObject'
        ],
        components: {
            ICountUp,
            VShimmerUserProfile
        },
        beforeMount: function () {
            if(this.addressProfile) this.getProfile(this.addressProfile);
        },
        data: function () {
            return {
                profile: {
                    address: '',
                    alias: '' ,
                    biography: '',
                    rank: 1000,
                    aliasSlug: ''
                },
                baseURL : environment.baseURL,
            }
        },
        methods: {
            creatorRoute(address) {
                return '/intel/' + address + '/';
            },
            getProfile: function (address) {
                ProfileService.getSpecificProfile(address, res => {
                    this.profile = res;
                    this.loading = false;
                }, error => {
                })
            },
            leaderboards(address){
                return '/leaderboards' + '?address=' + address;
            },
            loadProfileImage: function(pic, profileAddress){
                let path = this.baseURL + '/profile-image?image=';
                return ProfileService.getProfileImage(path, pic, profileAddress);
            },
        },
        watch: {
            addressProfile: function (newVal) {
                if (!this.profileObject){
                    this.getProfile(newVal);
                }
            },

            profileObject: function (loadedProfile) {
                if (loadedProfile.address) this.profile = loadedProfile;
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
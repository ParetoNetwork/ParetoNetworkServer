<template>
    <div>
        <div v-if="profile.address" class="row">
            <div class="col-12 col-sm-5 col-md-12 mb-2 mb-sm-0 mb-lg-5 border py-3">
                <div class="thumb profile-pic"
                     v-bind:style="{ backgroundImage: 'url( ' + loadProfileImage( profile.profile_pic)}"
                ></div>
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
                    <span class="text-dashboard text-pareto-gray"><b>NETWORK RANKING:</b>
                    <ICountUp
                            v-if="profile.rank"
                            :startVal="countUp.startVal"
                            :endVal="parseFloat(profile.rank)"
                            :decimals="decimalsLength(profile.rank)"
                            :duration="randomNumber(4,7)"
                            :options="countUp.options"
                            @ready="onReady"/>
                    <span v-else> 0 </span>
                </span>

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
        },
        data: function () {
            return {
                profile: {
                    address: '',
                    first_name: '' ,
                    last_name: '',
                    biography: '',
                    rank: 1000
                },
                baseURL : environment.baseURL
            }
        },
        methods: {
            getProfile: function (address) {
                ProfileService.getSpecificProfile( res => {
                    console.log(res);
                    this.profile = res;
                    this.loading = false;
                }, error => {
                }, address)
            },
            loadProfileImage: function(pic){
                let path = this.baseURL + '/profile-image?image=';
                return ProfileService.getProfileImage(path, pic);
            },
        },
        watch: {
            addressProfile: function (newVal) {
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
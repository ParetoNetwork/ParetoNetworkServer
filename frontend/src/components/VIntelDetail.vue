<template>
    <div class="main wrapp">
        <div class="container">
            <div class="row mx-2 pt-5">
                <div class="col-12 order-last order-lg-first col-lg-4 mb-4 p-0">
                    <VProfile :addressProfile="intel.address"></VProfile>
                </div>
                <div class="col-12 col-lg-7 offset-lg-1 mb-4 p-0">
                    <div class="row text-group">
                        <VShimmerIntelInformation v-if="!intel.blockAgo"></VShimmerIntelInformation>
                        <div v-else class="col-12 border p-3">
                            <div class="row py-4 border-bottom m-0">
                                <div class="col-md-10 p-0 pr-1">
                                    <span class="name-title"> {{intel.title}} </span>
                                </div>
                                <div class="col-md-2 p-0 pl-1">
                                    <div class="d-flex flex-column align-items-end">
                                        <span v-if="profile.alias" class="subtitle-dashboard" ><b> {{profile.alias}} </b></span>
                                        <span v-else class="subtitle-dashboard" ><b> {{profile.address.slice(0,15) + '...'}} </b></span>
                                        <span class="mb-2" style="font-size: 10px;">
                                            <ICountUp
                                                    v-if="intel.blockAgo"
                                                    :startVal="countUp.startVal"
                                                    :endVal="parseFloat(intel.blockAgo)"
                                                    :decimals="countUp.decimals"
                                                    :duration="randomNumber(1,3)"
                                                    :options="countUp.options"
                                                    @ready="onReady"/>
                                            <span v-else> 0 </span>
                                            Blocks Ago
                                        </span>
                                        <!-- <span v-if="false" class="text-dashboard text-pareto-gray"> REWARDED {{intel.reward}} TIMES </span> -->
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

    import ICountUp from 'vue-countup-v2';
    import {mapMutations, mapState} from "vuex";
    import {countUpMixin} from "../mixins/countUp";
    import AuthService from "../services/authService";
    import environment from '../utils/environment';

    import VProfile from "./VProfile.vue";

    import VShimmerUserProfile from "./Shimmer/IntelDetailView/VShimmerUserProfile";
    import VShimmerIntelInformation from "./Shimmer/IntelDetailView/VShimmerIntelInformation";

    export default {
        name: 'VIntelDetail',
        mixins: [countUpMixin],
        components: {
            ICountUp,
            VShimmerUserProfile,
            VShimmerIntelInformation,
            VProfile
        },
        computed: {
            ...mapState(["ws"])
        },
        data: function () {
            return {
                id: this.$route.params.id,
                loading: true,
                intel: {},
                address : {},
                profile: {
                    address: '',
                    alias: '',
                    biography: '',
                    rank: 1000
                },
                baseURL : environment.baseURL
            };
        },
        beforeMount: function(){
            this.$store.state.makingRequest = true;
            this.requestCall()
           // console.log(this.$route.params);
        },
        methods: {
            ...mapMutations(["iniWs"]),
            getIntel: function () {
                return DashboardService.getIntel(this.id, res => {
                   this.getProfile(res.address);
                   this.intel = res;
                }, error => {
                });
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
                   // console.log(res)
                    this.address = res;
                }, () => {
                    alert(error);
                });
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
            overrideOnMessage(){
                this.ws.onmessage = (data) => {
                    try {
                        const info = JSON.parse(data.data);

                        if (info.data.address) {
                            this.intel.blockAgo = info.data.block - this.intel.block;
                        }
                    } catch (e) {
                        console.log(e);
                    }
                };
            },
            requestCall : function(){
                Promise.all([
                    this.getIntel(),
                    this.getAddress()
                ]).then( values => {
                    this.$store.state.makingRequest = false;
                    this.socketConnection();
                });
            }
        }
    };
</script>

<style scoped lang="scss">
</style>
<template>
    <div class="main wrapp pareto-blue-dark">
        <div class="container-fluid px-lg-5">
            <notifications group="auth" position="bottom right"/>
            <div class="row m-0 pt-5" style="min-height: 100vh; width: 100%;">
                <div class="col-md-5 col-lg-2 mb-5 mt-2 m-sm-0 p-0 pr-2">
                    <VShimmerUserProfile v-if="!user.address"></VShimmerUserProfile>
                    <VProfile v-else :addressProfile="address" :profileObject="user" :can-edit="true"></VProfile>
                    <div class="mt-4">
                        <VEventFeed v-if="primalLoad" :user="user"></VEventFeed>
                        <VShimmerMyPost  v-else></VShimmerMyPost>
                    </div>
                </div>
                <div class="col-md-7 px-0 px-md-3 mb-3">
                    <VIntelFeed v-if="primalLoad" :user="user" :updateContent="updateContentVar" :block="block"
                                :address="address"></VIntelFeed>
                    <VShimmerFeed v-else></VShimmerFeed>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import dashboardService from "../services/dashboardService";
    import profileService from "../services/profileService";
    import AuthService from "../services/authService";

    import ICountUp from "vue-countup-v2";

    import VIntelFeed from "./VIntelFeed.vue";
    import {mapMutations, mapState, mapActions} from "vuex";
    import environment from "../utils/environment";

    import {countUpMixin} from "../mixins/countUp";

    import VShimmerUserProfile from "./Shimmer/IntelDetailView/VShimmerUserProfile";
    import VShimmerMyPost from "./Shimmer/IntelView/VShimmerMyPost";
    import VShimmerFeed from "./Shimmer/IntelView/VShimmerFeed";

    import VProfile from "./VProfile";
    import VEventFeed from "./VEventFeed";
    import errorService from "../services/errorService";

    export default {
        name: "VIntel",
        mixins: [countUpMixin],
        components: {
            ICountUp,
            VProfile,
            VIntelFeed,
            VEventFeed,
            VShimmerMyPost,
            VShimmerFeed,
            VShimmerUserProfile
        },
        data: function () {
            return {
                address: null,
                loading: true,
                block: 0,
                tokenAmount: 1,
                paretoAddress: window.localStorage.getItem('paretoAddress'),
                baseURL: environment.baseURL,
                etherscanUrl: window.localStorage.getItem('etherscan'),
                user: {
                    rank: 0,
                    score: 0,
                    tokens: 0
                },
                primalLoad: false,
                updateContentVar: 0
            };
        },
        mounted: function () {
            this.main();
        },
        computed: {
            ...mapState(["madeLogin", "ws", "signType", "pathId"]),
        },
        methods: {
            ...mapMutations(["intelEnter", "iniWs"]),
            creatorRoute(address) {
                return '/intel/' + address + '/';
            },
            loadAddress: function () {
                return dashboardService.getAddress(
                    res => {
                        this.user.address = res.address;
                        this.address = res;
                    },
                    error => {
                        let errorText = error.message ? error.message : error;
                        this.$notify({
                            group: 'notification',
                            type: 'error',
                            duration: 10000,
                            title: 'Login',
                            text: errorText
                        });
                    }
                );
            },
            numberToScientificNotation(number) {
                return (number + "").length > 12 ? number.toExponential(5) : number;
            },
            overrideOnMessage() {
                let wsa = this.ws;
                this.ws.onmessage = (data) => {
                    try {
                        const info = JSON.parse(data.data);
                        if (info.data.address) {
                            this.user.score = info.data.score;
                            this.user.rank = info.data.rank;
                            this.user.tokens = info.data.tokens;
                            // this.user.block = info.data.block;
                            this.block = info.data.block;
                        }
                        if (info.data.action) {
                            switch (info.data.action) {
                                case 'updateContent': {
                                    this.updateContentVar++;
                                }
                            }
                        }
                    } catch (e) {
                        errorService.sendErrorMessage('f32', e);
                        console.log(e);
                    }
                };
            },
            socketConnection() {
                let params = {rank: this.rank, limit: 100, page: this.page};
                if (!this.ws) {
                    this.iniWs();
                    let wss = this.ws;
                    this.ws.onopen = function open() {
                        wss.send(JSON.stringify(params));
                    };
                }
                this.overrideOnMessage();
            },
            loadProfile: function () {
                return profileService.getProfile(
                    res => {
                        this.user = res;
                    },
                    error => {
                        console.log('Could not retrieve profile')
                    }
                );
            },
            requestCall: function () {
                Promise.all([
                    this.loadProfile(),
                    this.loadAddress()
                ]).then(values => {
                    this.$store.state.makingRequest = false;
                });
            },
            main: function () {
                profileService.updateConfig(res => {
                    this.etherscanUrl = window.localStorage.getItem('etherscan')
                });
                this.$store.state.makingRequest = true;
                if (!this.madeLogin) {
                    this.intelEnter();
                    AuthService.postSign(
                        (res) => {
                            this.primalLoad = true;
                            this.requestCall();
                        },
                        () => {
                            this.primalLoad = true;
                            this.socketConnection();
                            this.requestCall();
                        }
                    );
                } else {
                    this.primalLoad = true;
                    this.socketConnection();
                    this.requestCall();
                }
            }
        }
    };
</script>

<style scoped lang="scss">


</style>
<template>
    <div class="main wrapp pareto-blue-dark">
        <div class="container-fluid px-lg-5">
            <notifications group="auth" position="bottom right"/>
            <div class="row m-0 pt-5" style="min-height: 100vh; width: 100%;">
                <div class="col-md-5 col-lg-2 mb-5 mt-2 m-sm-0">
                    <VShimmerUser v-if="!user.address"></VShimmerUser>
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
    import moment from "moment";
    import AuthService from "../services/authService";
    import ContentService from "../services/ContentService";
    import ICountUp from "vue-countup-v2";

    import VIntelFeed from "./VIntelFeed.vue";
    import {mapMutations, mapState, mapActions} from "vuex";
    import environment from "../utils/environment";

    import {countUpMixin} from "../mixins/countUp";

    import VShimmerUser from "./Shimmer/IntelView/VShimmerUser";
    import VShimmerMyPost from "./Shimmer/IntelView/VShimmerMyPost";
    import VShimmerFeed from "./Shimmer/IntelView/VShimmerFeed";

    import VProfile from "./VProfile";
    import VIntelButtonAction from "./Events/VIntelButtonAction";
    import VIntelPreview from "./VIntelPreview";
    import VEventFeed from "./VEventFeed";

    export default {
        name: "VIntel",
        mixins: [countUpMixin],
        components: {
            ICountUp,
            VProfile,
            VShimmerUser,
            VShimmerMyPost,
            VShimmerFeed,
            VIntelFeed,
            VIntelButtonAction,
            VIntelPreview,
            VEventFeed
        },
        data: function () {
            return {
                address: null,
                loading: true,
                block: 0,
                tokenAmount: 1,
                moment: moment,
                alias: "",
                bio: "",
                picture: "",
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
        filters: {
            date: function formatDate(date) {
                const temp = moment(date);
                return temp.format("MMMM Do, YYYY");
            }
        },
        mounted: function () {
            this.main();
        },
        computed: {
            ...mapState(["madeLogin", "ws", "signType", "pathId", "pendingTransactions"]),
        },
        methods: {
            ...mapMutations(["intelEnter", "iniWs"]),
            ...mapActions(["addTransaction", "transactionComplete", "assignTransactions", "editTransaction"]),
            creatorRoute(address) {
                return '/intel/' + address + '/';
            },
            goToIntelPage: function () {
                window.location = '/#/create';
            },
            leaderboards(address) {
                return '/leaderboards' + '?address=' + address;
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
                        this.alias = res.alias;
                        this.bio = res.biography;
                    },
                    () => {
                    }
                );
            },
            loadProfileImage: function (pic, profileAddress) {
                let path = this.baseURL + "/profile-image?image=";
                return profileService.getProfileImage(path, pic, profileAddress);
            },
            openInput: function () {
                document.getElementById("file").click();
            },
            randomNumber: function (min = 1, max = 3) {
                return Math.floor(Math.random() * (max - min + 1) + min);
            },
            requestCall: function () {
                Promise.all([
                    this.loadProfile(),
                    this.loadAddress()
                ]).then(values => {
                    this.$store.state.makingRequest = false;
                });
            },
            showModal() {
                this.$refs.myModalRef.show();
            },
            updatePicture: function () {
                let file = this.$refs.file.files[0];
                let formData = new FormData();
                formData.append("file", file);
                profileService.uploadProfilePic(formData, res => {
                    this.user.profile_pic = res;
                });
            },
            updateProfile() {
                const profile = {
                    alias: this.alias,
                    biography: this.bio
                };
                profileService.updateProfile(
                    profile,
                    res => {
                        this.user = res.data;

                        this.$refs.myModalRef.hide();
                        this.$notify({
                            group: 'notification',
                            type: 'success',
                            duration: 10000,
                            title: 'Login',
                            text: 'Profile Updated Successfully!'
                        });
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
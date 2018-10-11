<template>
    <div class="scrollable" id="myfeed" v-on:scroll="scrollMyFeed()">
        <ul class="list-unstyled list-group">
            <li class="text-left list-group-item border-0 px-1 py-2" :key="row._id"
                v-for="row of myFeed.content">
                <div class="row border-bottom pb-2">
                    <router-link tag="div" :to="intelRoute(row)" class="col-lg-9 pr-0">
                        <div class="row cursor-pointer">
                            <div class="col-2">
                                <div class="border p-1 mr-2" style="height: 50px; width: 50px;">
                                    <div data-v-514e8c24="" class="thumb"
                                         v-bind:style="{ backgroundImage: 'url( ' + loadProfileImage(row.createdBy.profilePic)}"
                                         style="width: 40px; height: 40px;"></div>
                                </div>
                            </div>
                            <div class="col-10 px-lg-1">
                                <div class="d-flex flex-column flex-grow-1 pr-3">
                                    <h1 class="title ellipsis">{{row.title|| 'No title'}}</h1>
                                    <div class="">
                                        <span v-if="false" class="text-dashboard">Rewarded {{row.rewarded}} Times</span>
                                        <div>
                                            <span class="text-dashboard">Disclosed by: {{row.address}}
                                            </span>
                                        </div>
                                        <div>
                                            Blocks ago:
                                            <ICountUp
                                                    :startVal="parseFloat(row.block) + parseFloat(row.blockAgo)"
                                                    :endVal="parseFloat(row.blockAgo)"
                                                    :decimals="decimalsLength(row.blockAgo)"
                                                    :duration="randomNumber(1,3)"
                                                    :options="countUp.options"
                                                    @ready="onReady"/>

                                        </div>
                                        <div>
                                            <span class="text-dashboard">
                                                <b>
                                                    {{dateStringFormat(row.dateCreated).toLocaleString("en-US") }} - {{ dateStringFormat(row.dateCreated)| moment("from", "now") }}
                                                </b>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </router-link>

                    <div class="col-12 col-lg-2 mt-2 mt-lg-0 ml-1 px-0">
                        <div v-if="false" class="text-right font-weight-bold">
                            <img src="../assets/images/icon-mini.svg" alt="" class="icon-mini">
                            <span class="text-right">{{row.reward}}</span>
                        </div>
                        <div v-if="user.address != row.address && row.intelAddress && signType != 'Manual' && row.expires > Math.round(new Date().getTime() / 1000)" class="text-center">
                            <div class="d-inline-block">
                                <p class="text-right text-secondary ellipsis reward-text"> <img src="../assets/images/LogoMarkColor.svg" width="20px" alt="">
                                    <b> {{ row.reward }} </b>
                                </p>
                                <b-btn class="btn-primary-pareto mx-auto px-4"
                                       style="max-width: 120px;"
                                       v-b-modal.modalToken @click="rewardId = row.id;  intelAddress = row.intelAddress; isAvailable();">REWARD
                                </b-btn>
                            </div>
                        </div>
                    </div>

                </div>

            </li>
        </ul>
    </div>
</template>

<script>
    import ICountUp from "vue-countup-v2";
    import {countUpMixin} from "../mixins/countUp";
    import moment from "moment";

    import ContentService from "../services/ContentService";

    export default {
        name: "VIntelFeed.vue",
        mixins: [countUpMixin],
        data: function(){
            return{
                allMyContent: [],
                moment: moment,
                myFeed: {
                    content: [],
                    loading: false,
                    page: 0,
                }
            }
        },
        components: {
            ICountUp
        },
        methods: {
            dateStringFormat(date) {
                return new Date(date);
            },
            intelRoute(intel){
                let param = (intel.txHash === '0x0')? intel._id : intel.txHash;
                return '/intel/' + intel.address + '/' + param;
            },
            loadContent: function (params) {
                return dashboardService.getAllContent(params,
                    res => {
                        this.loading = false;
                        this.myFeed.page++;
                        this.myFeed.loading = false;
                        this.myFeed.content = [...this.myFeed.content, ...res];
                    },
                    error => {
                        let errorText= error.message? error.message : error;
                        this.$notify({
                            group: 'notification',
                            type: 'error',
                            duration: 10000,
                            title: 'Content',
                            text: errorText });
                    }
                );
            },
            loadProfileImage: function (pic) {
                let path = this.baseURL + "/profile-image?image=";
                return profileService.getProfileImage(path, pic);
            },
            randomNumber: function (min = 1, max = 3) {
                return Math.floor(Math.random() * (max - min + 1) + min);
            },
            rewardIntel: function (ID, tokenAmount, intelAddress) {
                this.hideModal();
                this.modalWaiting =true;
                if (!tokenAmount) {
                    this.$notify({
                        group: 'notification',
                        type: 'error',
                        duration: 10000,
                        text: 'No Token Amount' });

                    this.tokenAmount = 1;
                    return;
                }

                // console.log(ID, tokenAmount);
                ContentService.rewardIntel(
                    {ID, tokenAmount, intelAddress}, {signType: this.signType, pathId: this.pathId} ,
                    res => {
                        this.modalWaiting =false;
                        this.$notify({
                            group: 'notification',
                            type: 'success',
                            duration: 10000,
                            text: 'Success'
                        });
                    },
                    err => {
                        this.modalWaiting =false;
                        this.$notify({
                            group: 'notification',
                            type: 'error',
                            duration: 10000,
                            text: err.message?err.message:err
                        });
                    }
                );
            },
            scrollMyFeed: function () {
                let list = document.getElementById("myfeed");

                if (list.scrollTop + list.offsetHeight >= list.scrollHeight * 0.9
                    && !this.myFeed.loading) {
                    const params = {limit: 10, page: this.myFeed.page};
                    this.myFeed.loading = true;

                    this.$store.state.makingRequest = true;

                    let myFeedContentReady = this.loadContent(params);
                    myFeedContentReady.then(()=>{
                        this.$store.state.makingRequest = false;
                    });
                }
            },
        }
    }
</script>

<style scoped>

</style>
<template>
    <div class="text-left">
        <div class="row p-0">
            <div v-if="!eventRow" v-bind:class="{ 'col-3 col-lg-2' : !eventRow }">
                <div class="border p-1 mr-2" style="height: 50px; width: 50px;">
                    <div data-v-514e8c24="" class="thumb"
                         v-bind:style="{ backgroundImage: 'url( ' + loadProfileImage(intel.createdBy.profilePic, intel.createdBy.address)}"
                         style="width: 40px; height: 40px;">
                    </div>
                </div>
            </div>
            <router-link
                    tag="div"
                    :to="intelRoute(intel)"
                    class="cursor-pointer p-0"
                    v-bind:class="{ 'col-9 col-lg-6' : !eventRow , 'col-12 col-lg-7': eventRow }">
                <h1 class="title ellipsis">{{intel.title|| 'No title'}}</h1>
                <p class="text-dashboard ellipsis">Disclosed by: {{intel.createdBy.alias ? intel.createdBy.alias : intel.createdBy.address}} </p>
                <p v-if="!intel.validated && eventRow"> Pending Blockchain Confirmation</p>
                <p>{{intel.dateCreated | dateFilter}}</p>
            </router-link>
            <div class="p-1" v-bind:class="{ 'col-12 col-lg-4' : !eventRow , 'col-12 col-lg-5': eventRow }">
                <div class="text-center">
                    <VIntelButtonAction :user="user" :intel="intel"></VIntelButtonAction>
                </div>
            </div>
        </div>
        <div class="row border-bottom">
            <div class="col-md col-xs ellipsis text-left">
                <a style="color: #000;" v-bind:href="etherscanUrl+'/tx/'+intel.txHash" target="_blank">
                    <i class="fa fa-th-large" style="color: #000; margin: 5px;"></i>
                    <ICountUp
                            :startVal="parseFloat(intel.block) + parseFloat(intel.blockAgo)"
                            :endVal="parseFloat(intel.blockAgo)"
                            :decimals="decimalsLength(intel.blockAgo)"
                            :duration="randomNumber(1,3)"
                            :options="countUp.options"
                            @ready="onReady"/>
                </a>
            </div>
            <div class="col-md col-xs-4 ellipsis" style="text-align: center;">
                <a style="color: #000;" v-bind:href="etherscanUrl+'/tx/'+intel.txHash" target="_blank"><i class="fa fa-calendar-o" style="color: #000;"></i>&nbsp;
                    <span class="text-dashboard"><b>{{ dateStringFormat(intel.dateCreated)| moment("from", "now") }}</b></span></a>
            </div>
            <div class="col-md col-xs">
                <p class="text-right text-secondary ellipsis" style="margin-right: 5px;"><img
                        src="../assets/images/LogoMarkColor.svg" width="20px" alt="">
                    <b> {{ intel.totalReward }} </b>
                </p>
            </div>
        </div>
    </div>
</template>

<script>
    import ICountUp from "vue-countup-v2";
    import moment from "moment";

    import profileService from "../services/profileService";
    import VIntelButtonAction from "./Events/VIntelButtonAction";
    import environment from "../utils/environment";

    import {countUpMixin} from "../mixins/countUp";

    export default {
        name: "VIntelPreview",
        props : [
            'user', 'intel', 'eventRow'
        ],
        mixins: [countUpMixin],
        components: {
            ICountUp,
            VIntelButtonAction,
        },
        data : function () {
            return {
                baseURL: environment.baseURL,
                etherscanUrl: window.localStorage.getItem('etherscan') ,
            }
        },
        filters: {
            dateFilter: function formatDate(date) {
                const temp = moment(date);
                return temp.format("MMMM Do, YYYY");
            }
        },
        methods : {
            dateStringFormat(date) {
                return new Date(date);
            },
            intelRoute: function (intel) {
                let param = (intel.txHash === '0x0') ? intel._id : intel.txHash;
                return '/intel/' + intel.address + '/' + param;
            },
            loadProfileImage: function (pic, profileAddress) {
                let path = this.baseURL + "/profile-image?image=";
                return profileService.getProfileImage(path, pic, profileAddress);
            },
            randomNumber: function (min = 1, max = 3) {
                return Math.floor(Math.random() * (max - min + 1) + min);
            }
        }
    }
</script>

<style scoped>

</style>
<template>
    <div class="text-left">
        <div class="row pb-3 border-bottom">
            <div v-if="!eventRow" v-bind:class="{ 'col-4 col-md-4 col-lg-2' : !eventRow }">
                <router-link tag="div" class="thumb profile-pic cursor-pointer" style="width: 50px; height: 50px"
                             v-bind:style="{ backgroundImage: 'url( ' + loadProfileImage(intel.createdBy.profilePic, intel.createdBy.address)}"
                             :to="creatorRoute(intel.createdBy.aliasSlug || intel.createdBy.address)"
                ></router-link>
            </div>
            <router-link
                    tag="a"
                    :to="intelRoute(intel)"
                    class="cursor-pointer intel-preview pl-1"
                    v-bind:class="{ 'col-8 col-lg-7' : !eventRow , 'col-12 col-lg-7': eventRow }">
                <h1 class="subtitle-intel text-user-content" v-line-clamp="2">{{intel.title|| 'No title'}}</h1>
                <div class="row mt-2">
                    <div class="col-12 col-md-12 col-lg-5 ">
                        <p class="text-user ellipsis ">Disclosed by:
                            <b>
                                {{intel.createdBy.alias ? intel.createdBy.alias : intel.createdBy.address}}
                            </b>
                        </p>
                    </div>
                    <div class="col-6 col-md-6 col-lg-4">
                        <p>
                            <font-awesome-icon class="green-color" :icon="['fas', 'calendar']" />
                            {{intel.dateCreated | dateFilter}}
                        </p>
                    </div>
                    <div class="col-6 col-md-6 col-lg-3">
                        <p>
                            <i class="fa fa-th-large green-color mr-2"></i>
                            <ICountUp
                                    :startVal="parseFloat(intel.block) + parseFloat(intel.blockAgo)"
                                    :endVal="parseFloat(intel.blockAgo)"
                                    :decimals="decimalsLength(intel.blockAgo)"
                                    :duration="randomNumber(1,3)"
                                    :options="countUp.options"
                                    @ready="onReady"/>
                        </p>
                    </div>
                </div>
                <!--<p v-if="!intel.validated && eventRow"> Pending Blockchain Confirmation</p>-->

            </router-link>
            <div v-bind:class="{ 'col-12 col-md-12 col-lg-3' : !eventRow , 'col-12 col-lg-5': eventRow }">
                <div class="text-center text-xl-right mt-2 mt-xl-0">
                    <VIntelButtonAction :user="user" :intel="intel"></VIntelButtonAction>
                </div>
            </div>
        </div>
        <!--<div class="row">-->
            <!--<div class="col-md col-xs ellipsis text-left">-->
                <!--<a style="color: #000;" v-bind:href="etherscanUrl+'/tx/'+intel.txHash" target="_blank">-->
                    <!--<font-awesome-icon class="ml-2 mr-1" icon="th" />-->
                    <!--<ICountUp-->
                            <!--:startVal="parseFloat(intel.block) + parseFloat(intel.blockAgo)"-->
                            <!--:endVal="parseFloat(intel.blockAgo)"-->
                            <!--:decimals="decimalsLength(intel.blockAgo)"-->
                            <!--:duration="randomNumber(1,3)"-->
                            <!--:options="countUp.options"-->
                            <!--@ready="onReady"/>-->
                <!--</a>-->
            <!--</div>-->
            <!--<div class="col-md col-xs-4 ellipsis" style="text-align: center;">-->
                <!--<a style="color: #000;" v-bind:href="etherscanUrl+'/tx/'+intel.txHash" target="_blank">-->
                    <!--<font-awesome-icon class="ml-2 mr-1" :icon="['fas', 'calendar']" />&nbsp-->
                    <!--<span class="text-dashboard">-->
                        <!--<b>{{ dateStringFormat(intel.dateCreated)| moment("from", "now") }}-->
                        <!--</b></span></a>-->
            <!--</div>-->
            <!--<div class="col-md col-xs">-->
                <!--<p class="text-right text-secondary ellipsis" style="margin-right: 5px;"><img-->
                        <!--src="../assets/images/LogoMarkColor.svg" width="20px" alt="">-->
                    <!--<b> {{ intel.totalReward }} </b>-->
                <!--</p>-->
            <!--</div>-->
        <!--</div>-->
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
        props: [
            'user', 'intel', 'eventRow'
        ],
        mixins: [countUpMixin],
        components: {
            ICountUp,
            VIntelButtonAction,
        },
        data: function () {
            return {
                baseURL: environment.baseURL,
                etherscanUrl: window.localStorage.getItem('etherscan'),
            }
        },
        filters: {
            dateFilter: function formatDate(date) {
                const temp = moment(date);
                return temp.format("MMMM Do, YYYY");
            }
        },
        mounted(){
        },
        methods: {
            creatorRoute(address) {
                return '/intel/' + address + '/';
            },
            dateStringFormat(date) {
                return new Date(date);
            },
            intelRoute: function (intel) {
                let param = (intel.txHash === '0x0') ? intel._id : intel.txHash;
                return '/intel/' + (intel.createdBy.aliasSlug || intel.address) + '/' + param;
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
    a.intel-preview {
        color: white;
    }

    a.intel-preview:hover {
        text-decoration: none;
    }
</style>
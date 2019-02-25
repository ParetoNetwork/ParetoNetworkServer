<template>
    <div class="text-left pl-1">
        <div class="row pb-3 border-bottom" :class="{'ml-2 mr-0 py-2': eventRow}" style="border-bottom-color: black !important;">
            <div v-if="!eventRow" v-bind:class="{ 'col-4 col-md-4 col-lg-2' : !eventRow }">
                <div v-if="onboardingPicture"
                     class="thumb profile-pic cursor-pointer ml-2"
                     style="width: 50px; height: 50px"
                     v-bind:style="{ backgroundImage: 'url( ' + onboardingPicture}">
                </div>
                <router-link v-else tag="div" class="thumb profile-pic cursor-pointer ml-2" style="width: 50px; height: 50px"
                             v-bind:style="{
                                backgroundImage: 'url( ' + loadProfileImage(intel.createdBy.profilePic, intel.createdBy.address)
                             }"
                             :to="creatorRoute(intel.createdBy.aliasSlug || intel.createdBy.address)"
                ></router-link>
            </div>
            <div class="cursor-pointer intel-preview"
                    v-bind:class="{ 'col-8 col-lg-7' : !eventRow , 'col-12 p-0': eventRow }">
                <router-link
                        tag="h1"
                        :to="intelRoute(intel)"
                        class="subtitle-intel text-user-content" v-line-clamp="1">{{intel.title|| 'No title'}}</router-link>
                <div class="row mt-2">
                    <div v-if="!eventRow" class="col-12 col-md-12 col-lg-5 ellipsis">
                        <a v-bind:href="creatorRoute(intel.createdBy.aliasSlug || intel.createdBy.address)" target="_blank" class="text-user ellipsis ">Disclosed by:
                            <b>
                                {{intel.createdBy.alias ? intel.createdBy.alias : intel.createdBy.address}}
                            </b>
                        </a>
                    </div>
                    <a v-bind:href="etherscanUrl+'/tx/'+intel.txHash"
                       target="_blank" class="col-6 col-md-6 ellipsis" :class="{'col-lg-6': eventRow, 'col-lg-4': !eventRow}">
                        <p>
                            <font-awesome-icon class="green-color" :icon="['fas', 'calendar']" />
                            {{ dateStringFormat(intel.dateCreated)| moment("from", "now") }}
                        </p>
                    </a>
                    <div class="col-6 col-md-6" :class="{'col-lg-6': eventRow, 'col-lg-3': !eventRow}">
                        <a v-bind:href="etherscanUrl+'/tx/'+intel.txHash"
                           target="_blank">
                            <i class="fa fa-th-large green-color mr-2"></i>
                            <ICountUp
                                    :startVal="parseFloat(intel.block) + parseFloat(intel.blockAgo)"
                                    :endVal="parseFloat(intel.blockAgo)"
                                    :decimals="decimalsLength(intel.blockAgo)"
                                    :duration="randomNumber(1,3)"
                                    :options="countUp.options"
                                    @ready="onReady"/>
                        </a>
                    </div>
                </div>

            </div>
            <div v-if="!eventRow" v-bind:class="{ 'col-12 col-md-12 col-lg-3' : !eventRow , 'col-12 col-lg-5': eventRow }">
                <div class="text-center text-xl-right mt-2 mt-xl-0">
                    <VIntelButtonAction :user="user" :intel="intel"></VIntelButtonAction>
                </div>
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
        props: [
            'user', 'intel', 'eventRow', 'onboardingPicture'
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
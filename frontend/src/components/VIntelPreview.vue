<template>
    <div class="text-left pl-1">
        <div class="row pb-3 border-bottom" :class="{'ml-2 mr-0 py-2': eventRow}"
             style="border-bottom-color: black !important;">
            <div class="col-md-12 col-lg-9">
                <div class="row">
                    <div v-if="!eventRow" v-bind:class="{ 'col-2 col-md-2 col-lg-2' : !eventRow }">
                        <div v-if="onboardingPicture"
                             class="thumb profile-pic cursor-pointer ml-2"
                             style="width: 50px; height: 50px"
                             v-bind:style="{ backgroundImage: 'url( ' + onboardingPicture}">
                        </div>
                        <router-link v-else tag="div" class="thumb profile-pic cursor-pointer ml-2"
                                     style="width: 50px; height: 50px"
                                     v-bind:style="{
                                        backgroundImage: 'url( ' + loadProfileImage(intel.createdBy.profilePic, intel.createdBy.address)
                                     }"
                                     :to="creatorRoute(intel.createdBy.aliasSlug || intel.createdBy.address)"
                        ></router-link>
                    </div>
                    <div class="cursor-pointer intel-preview"
                         v-bind:class="{ 'col-10 col-md-10 col-lg-10' : !eventRow , 'col-10 p-0': eventRow }">
                        <router-link
                                tag="h1"
                                :to="intelRoute(intel)"
                                class="subtitle-intel text-user-content redacted" v-line-clamp="1" v-html="convertToHideText(intelTitle(intel))">
                        </router-link>
                        <div class="row">
                            <div v-if="!eventRow" class="col-12 col-md-12 ellipsis">
                                <!-- <a v-bind:href="creatorRoute(intel.createdBy.aliasSlug || intel.createdBy.address)" class="text-user ellipsis ">Disclosed by:
                                    <b>
                                        {{intel.createdBy.alias ? intel.createdBy.alias : intel.createdBy.address}}
                                    </b>
                                </a> -->
                                Disclosed by:
                                <b>
                                    {{intel.createdBy.alias ? intel.createdBy.alias : intel.createdBy.address}}
                                </b>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-6 col-md-6 ellipsis" :class="{'col-lg-6': eventRow, 'col-lg-6': !eventRow}">
                                <a v-bind:href="etherscanUrl+'/tx/'+intel.txHash"
                                   target="_blank">
                                    <p>
                                        <font-awesome-icon class="green-color" :icon="['fas', 'calendar']"/>
                                        {{ dateStringFormat(intel.dateCreated)| moment('from', 'now') }}
                                    </p>
                                </a>
                            </div>
                            <div class="col-6 text-center" :class="{'col-lg-6': eventRow, 'col-lg-6': !eventRow}">
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
                </div>
            </div>
            <div v-if="!eventRow"
                 v-bind:class="{ 'col-12 col-md-12 col-lg-3' : !eventRow , 'col-12 col-lg-5': eventRow }">
                <div class="text-center text-xl-right mt-2 mt-xl-0">
                    <VIntelButtonAction :user="user" :intel="intel"></VIntelButtonAction>
                    <p v-if="intel.totalReward>0" class="text-center text-xl-right ellipsis mt-2 mr-4">
                        <font-awesome-icon class="green-color" :icon="['fas', 'coins']"/>&nbsp;
                        <ICountUp
                                :startVal="0"
                                :endVal="parseFloat(intel.totalReward)"
                                :decimals="decimalsLength(intel.totalReward)"
                                :duration="randomNumber(1,3)"
                                :options="countUp.options"
                                @ready="onReady"/>
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
  import ICountUp from 'vue-countup-v2';
  import moment from 'moment';

  import profileService from '../services/profileService';
  import VIntelButtonAction from './Events/VIntelButtonAction';
  import environment from '../utils/environment';

  import {countUpMixin} from '../mixins/countUp';
  import {convertToHideText} from '../utils/Utils';

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
            intelTitle(intel){
                if(intel.title){
                    const CryptoJS = require("crypto-js");
                    if(intel.createdBy.address == this.user.address){
                        const decrypted = CryptoJS.AES.decrypt(intel.title, localStorage.getItem("groupKeys"));
                        return decrypted.toString(CryptoJS.enc.Utf8);
                    }else{
                        const decrypted = CryptoJS.AES.decrypt(intel.title, localStorage.getItem("groupKeys-" + intel.createdBy.address));
                        return decrypted.toString(CryptoJS.enc.Utf8);
                    }
                }else{
                  return 'No title';
                }
            },
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
            },
            convertToHideText: function (text) {
                //console.log(text);
                return convertToHideText(text);
            },
        }
    }
  };
</script>

<style scoped>
    a.intel-preview {
        color: white;
    }

    a.intel-preview:hover {
        text-decoration: none;
    }
    .redacted span:after {
        background: black;
        border-radius: 0.1em;
        box-shadow: 0 0 1px rgba(0, 0, 0, 0.35);
        content: " ";
        width: 100%;
        height: 1.3em;
        left: 0;
        position: absolute;
        transform: skewY(-5deg) rotate(5deg);
    }
</style>

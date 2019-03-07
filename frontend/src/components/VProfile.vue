<template>
  <div v-if="profile.address" class="pareto-blue-dark text-center text-lg-left">
    <div v-if="onboardingPicture"
         class="thumb profile-pic cursor-pointer"
         style="width: 100px; height: 100px;"
         v-bind:style="{ backgroundImage: 'url( ' + onboardingPicture}">
    </div>
    <div v-if="canEdit && !onboardingPicture" class="thumb profile-pic cursor-pointer" @click="openInput()">
      <div data-v-514e8c24="" class="thumb" id="wrapper"
           v-bind:style="{ backgroundImage: 'url( ' + loadProfileImage(profile.profile_pic, profile.address)}"
           style="width: 100px; height: 100px;">
        <div class="text text-white justify-content-center align-items-center h-100 w-100"><span>Change Image <i
            class="fa fa-pencil-alt"
            aria-hidden="true"></i></span>
        </div>
      </div>
      <input type="file" class="d-none" id="file" ref="file" v-on:change="updatePicture()"/>
    </div>

    <router-link v-if="!canEdit && !onboardingPicture" tag="div" class="thumb profile-pic cursor-pointer"
                 v-bind:style="{ backgroundImage: 'url( ' + loadProfileImage(profile.profile_pic, profile.address)}"
                 :to="creatorRoute(profile.aliasSlug || profile.address)"
    ></router-link>
    <div class="mt-4">
      <p class="subtitle-user-content"><b> {{profile.alias || profile.address.substring(0,10) + '...'}} :</b></p>
      <p class="text-user-content mt-2" :class="{'cursor-pointer' : !!canEdit}" @click="openEditProfileModal()">
                <span v-if="canEdit">
                    <i class="fa fa-edit green-color" style="margin-left: -15px"></i>
                </span>
        {{profile.biography || 'No Bio to show'}}
      </p>
      <div class="row cursor-pointer mt-3">
        <div class="ml-0 col ellipsis">
          <i class="fa fa-book green-color" style="margin-left: -15px"></i>
          <router-link tag="span" :to="creatorRoute(profile.aliasSlug || profile.address)"
                       class="d-inline-block pl-2"> {{profile.address}}
          </router-link>
        </div>
      </div>
      <div class="row cursor-pointer mt-3">
        <div class="ml-0 col px-0">
          <img src="../assets/images/LogoMarkColor.svg"
               width="15px"
               alt=""
               style="margin-left: -5px"
               class="mr-2">
          <a v-bind:href="etherscanUrl+'/token/'+paretoAddress+'?a=' + profile.address"
             target="_blank">
                        <span class="text-user-content">
                            <b>
                                <ICountUp
                                    :startVal="countUp.startVal"
                                    :endVal="parseFloat(profile.tokens)"
                                    :decimals="decimalsLength(profile.tokens)"
                                    :duration="randomNumber(3,6)"
                                    :options="countUp.options"
                                    @ready="onReady"/>
                            </b>
                        </span>
            <i class="fa fa-external-link-alt green-color ml-1"></i>
          </a>
        </div>
      </div>
        <div v-if="profile.minScore && (profile.minScore - profile.score > 0)" class="row cursor-pointer mt-3">
            <div class="ml-0 col px-0">
                         <span class="text-user-content">
                        <b> <p> Score needed: </p> </b>
                         </span>
                <Span class="mb-1">
                            <i class="fa fa-star green-color"></i>
                            <Span class="mb-1 p-2">
                               <ICountUp
                                       :startVal="countUp.startVal"
                                       :endVal="parseFloat(profile.minScore - profile.score)"
                                       :decimals="decimalsLength(profile.minScore - profile.score)"
                                       :duration="randomNumber(3,6)"
                                       :options="countUp.options"
                                       @ready="onReady"/>
                            </Span>
                        </Span>

            </div>
        </div>
    </div>
    <div class="row justify-content-center justify-content-lg-start text-center mt-4">
      <router-link tag="div" class="cursor-pointer border mr-3 p-2 mb-2" :to="leaderboards(profile.address)"
                   style="min-width: 80px">
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
      <router-link tag="div" class="cursor-pointer border mb-2 p-2"
                   :to="leaderboards(profile.address)" style="min-width: 80px">
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
      <div></div>
    </div>
    <!--<button class="btn btn-success-pareto mt-5">-->
    <!--<span class="px-4 subtitle-dashboard">REWARD AUTHOR</span>-->
    <!--</button>-->

    <VModalEditProfile v-if="showModalEditProfile" @profileEdit="editedProfileEvent"
                       :user="profile"></VModalEditProfile>
  </div>
  <VShimmerUserProfile v-else></VShimmerUserProfile>
</template>

<script>
  import ProfileService from '../services/profileService';

  import ICountUp from 'vue-countup-v2';
  import {mapMutations, mapState} from "vuex";
  import {countUpMixin} from "../mixins/countUp";
  import environment from '../utils/environment';

  import VModalEditProfile from "./Modals/VModalEditProfile"
  import VShimmerUserProfile from "./Shimmer/IntelDetailView/VShimmerUserProfile";

  export default {
    name: "VProfile",
    mixins: [countUpMixin],
    props: [
      'addressProfile', 'profileObject', 'canEdit', 'onboardingPicture'
    ],
    components: {
      ICountUp,
      VShimmerUserProfile,
      VModalEditProfile
    },
    computed: {
      ...mapState(['showModalEditProfile', 'address']),
    },
    beforeMount: function () {
      if (this.profileObject) {
        this.profile = this.profileObject;
      } else if (this.addressProfile) {
        this.getProfile(this.addressProfile);
      }
    },
    data: function () {
      return {
        canOpenProfileModal: false,
        baseURL: environment.baseURL,
        etherscanUrl: window.localStorage.getItem('etherscan'),
        profile: {
          address: '',
          alias: '',
          biography: '',
          rank: 1000,
          aliasSlug: ''
        },
        paretoAddress: window.localStorage.getItem('paretoAddress'),
      }
    },
    methods: {
      ...mapMutations(['openModalEditProfile']),
      creatorRoute(address) {
        return '/intel/' + address + '/';
      },
      editedProfileEvent(event) {
        this.profile = event;
      },
      getProfile: function (address) {
        ProfileService.getSpecificProfile(address, res => {
          this.profile = res;
          this.loading = false;
        }, error => {
          console.log(error);
        })
      },
      leaderboards(address) {
        return '/leaderboards' + '?address=' + address;
      },
      loadProfileImage: function (pic, profileAddress) {
        let path = this.baseURL + '/profile-image?image=';
        return ProfileService.getProfileImage(path, pic, profileAddress);
      },
      openEditProfileModal() {
        if (this.canEdit) {
          this.openModalEditProfile(true);
        }
      },
      openInput: function () {
        document.getElementById("file").click();
      },
      updatePicture: function () {
        let file = this.$refs.file.files[0];
        let formData = new FormData();
        formData.append("file", file);
        ProfileService.uploadProfilePic(formData, res => {
          this.profile.profile_pic = res;
        }, error => {
          console.log(error);
        });
      }
    },
    watch: {
      addressProfile: function (newVal) {
        if (!this.profileObject) {
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
    color: black;
  }
</style>
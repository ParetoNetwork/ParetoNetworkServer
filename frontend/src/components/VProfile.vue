<template>
  <div v-if="profile.address" class="pt-md-2 pt-lg-0 pb-3 pareto-blue-dark text-center text-lg-left">
    <div v-if="onboardingPicture"
         class="thumb profile-pic cursor-pointer"
         style="width: 100px; height: 100px;"
         v-bind:style="{ backgroundImage: 'url( ' + onboardingPicture}">
    </div>
    <div v-if="canEdit && !onboardingPicture" class="thumb cursor-pointer" @click="openInput()">
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
    <div class="mt-1">
      <div v-responsive.sm.xs class="row text-center justify-content-center align-items-center">
        <div class="text-center ml-2 mr-2 mt-1" @click="openModalInfoProfileClick()">
          <i class="fas fa-question-circle"></i>
        </div>
        <p class="subtitle-user-content"><b> {{profile.alias || profile.address.substring(0,10) + '...'}} :</b></p>
      </div>
      <div v-responsive="['hidden-xs', 'hidden-sm']" class="row">
        <div class="text-center ml-2 mr-2 mt-1" @click="openModalInfoProfileClick()">
          <i class="fas fa-question-circle"></i>
        </div>
        <p class="subtitle-user-content"><b> {{profile.alias || profile.address.substring(0,10) + '...'}} :</b></p>
      </div>
      <p class="text-user-content mt-1 mt-xl-1" :class="{'cursor-pointer' : !!canEdit}"
         @click="openEditProfileModal()">
                <span v-if="canEdit">
                    <i class="fa fa-edit green-color" style="margin-left: -15px"></i>
                </span>
        {{profile.biography || 'No Bio to show'}}
      </p>
      <div class="row cursor-pointer mt-1 mt-xl-1">
        <div class="ml-0 col ellipsis">
          <i class="fa fa-book green-color" style="margin-left: -15px"></i>
          <router-link tag="span" :to="creatorRoute(profile.aliasSlug || profile.address)"
                       class="d-inline-block pl-2"> {{profile.address}}
          </router-link>
        </div>
      </div>
      <div class="row cursor-pointer mt-1 mt-xl-1">
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
      <!--  <div v-if="profile.minScore && (profile.minScore - profile.score > 0)" class="row cursor-pointer mt-3">
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
        </div> -->
    </div>
    <div class="row justify-content-center justify-content-lg-start text-center mt-1 mt-xl-1">
      <router-link tag="div" class="cursor-pointer border mr-1 p-2 mb-2" :to="leaderboards(profile.address)"
                   style="min-width: 80px">
        <ICountUp
                :startVal="countUp.startVal"
                :endVal="parseFloat(profile.rank)"
                :decimals="decimalsLength(profile.rank)"
                :duration="randomNumber(3,6)"
                :options="countUp.options"
                @ready="onReady"/>


        <p>Rank <i class="fa fa-globe"></i></p>
      </router-link>
      <router-link tag="div" class="cursor-pointer border mr-1 mb-2 p-2"
                   :to="leaderboards(profile.address)" style="min-width: 80px">
        <span :class="{'text-onRankUpdated' : profile.rankUpdated}">

                <ICountUp
                        v-if="profile.score"
                        :startVal="countUp.startVal"
                        :endVal="parseFloat(profile.score)"
                        :decimals="decimalsLength(profile.score)"
                        :duration="randomNumber(3,6)"
                        :options="countUp.options"
                        @ready="onReady"/>
                <span v-else> 0 </span>
        </span>


        <div class="mb-1">
          Score <i class="fa fa-star fa-lg" style="color: #fca130;"></i>
        </div>
      </router-link>
    </div>

    <VModalEditProfile v-if="showModalEditProfile" @profileEdit="editedProfileEvent"
                       :user="profile"></VModalEditProfile>
    <VModalInfo v-if="showModalInfoProfile" :tutorial="tutorials.tutorial.profile"></VModalInfo>
  </div>
  <VShimmerUserProfile v-else></VShimmerUserProfile>
</template>

<script>
  import ProfileService from '../services/profileService';

  import ICountUp from 'vue-countup-v2';
  import {mapMutations, mapState} from 'vuex';
  import {countUpMixin} from '../mixins/countUp';
  import environment from '../utils/environment';

  import VModalEditProfile from './Modals/VModalEditProfile';
  import VShimmerUserProfile from './Shimmer/IntelDetailView/VShimmerUserProfile';
  import VModalInfo from "./Modals/VModalInfo";

  import {tutorials} from '../utils/tutorialInfo';

  export default {
    name: 'VProfile',
    mixins: [countUpMixin],
    props: [
      'addressProfile', 'profileObject', 'canEdit', 'onboardingPicture'
    ],
    components: {
      ICountUp,
      VShimmerUserProfile,
      VModalEditProfile,
      VModalInfo
    },
    computed: {
      ...mapState(['showModalEditProfile', 'address', 'showModalInfoProfile'])
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
        tutorials: { header : '', body : ''},
        profile: {
          address: '',
          alias: '',
          biography: '',
          rank: 1000,
          aliasSlug: ''
        },
        paretoAddress: window.localStorage.getItem('paretoAddress')
      };
    },
    mounted: function() {
      this.tutorials = tutorials;
    },
    methods: {
      ...mapMutations(['openModalEditProfile', 'openModalInfoProfile']),
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
        });
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
        document.getElementById('file').click();
      },
      openModalInfoProfileClick() {
        this.openModalInfoProfile(true);
      },
      updatePicture: function () {
        let file = this.$refs.file.files[0];
        let formData = new FormData();
        formData.append('file', file);
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
  };
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

  .text-onRankUpdated {
    font-weight: bold;
    color: gold;;
  }
</style>

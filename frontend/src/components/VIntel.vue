<template>
  <div class="main wrapp pareto-blue-dark">
    <div class="container-fluid position-relative px-lg-5">
      <div class="blocking-content" v-if="!loggedUser" v-on:click="showModalSplash()">
      </div>
      <notifications group="auth" position="bottom right"/>
      <div class="row m-0 pt-4 pt-lg-2" style="width: 100%;">
        <div class="col-md-3 col-lg-2 order-2 order-md-1 order-xl-1 row m-0 p-xl-0">
          <div class="col-12 my-3 my-md-0">
            <VShimmerUserProfile v-if="!user.address"></VShimmerUserProfile>
            <VProfile v-else :addressProfile="user.address" :profileObject="user" :can-edit="true"
                      :onboardingPicture="onboarding"></VProfile>
          </div>
          <div class="col-12 px-0">
            <VEventFeed v-if="primalLoad" :user="user" :updateHash="updateHash"
                        :defaultTransactions="information.transactions" :block="block"></VEventFeed>
            <VShimmerMyPost v-else></VShimmerMyPost>
          </div>
        </div>
        <div class="col-md-6 col-lg-6 px-2 order-1 order-md-2 order-xl-3">
          <VIntelFeed v-if="primalLoad" :user="user" :updateContent="updateContentVar" :block="block"
                      :defaultContent="information.content" :onboardingPicture="onboarding"></VIntelFeed>
          <VShimmerFeed v-else></VShimmerFeed>
        </div>
      </div>
    </div>
    <ModalSignIn v-if="showModalSign"></ModalSignIn>
    <LoginOptions v-if="showModalLoginOptions"></LoginOptions>
    <ModalLedgerNano v-if="showModalLedgerNano"></ModalLedgerNano>
    <ModalSplashOnboarding v-if="showModalOnboarding && !loggedUser"></ModalSplashOnboarding>
  </div>
</template>

<script>
  import dashboardService from '../services/dashboardService';
  import profileService from '../services/profileService';
  import AuthService from '../services/authService';

  import ICountUp from 'vue-countup-v2';

  import VIntelFeed from './VIntelFeed.vue';
  import {mapMutations, mapState} from 'vuex';
  import environment from '../utils/environment';

  import {countUpMixin} from '../mixins/countUp';

  import VShimmerUserProfile from './Shimmer/IntelDetailView/VShimmerUserProfile';
  import VShimmerMyPost from './Shimmer/IntelView/VShimmerMyPost';
  import VShimmerFeed from './Shimmer/IntelView/VShimmerFeed';

  import VProfile from './VProfile';
  import VEventFeed from './VEventFeed';
  import errorService from '../services/errorService';

  import LoginOptions from './Modals/VLoginOptions';
  import ModalSignIn from './VModalManualSigIn';
  import ModalLedgerNano from './Modals/VModalLedgerNano';
  import ModalSplashOnboarding from './Modals/VModalSplashOnboarding';

  import {information} from '../utils/onboardingInfo';

  import VFab from './VFab';


  export default {
    name: 'VIntel',
    mixins: [countUpMixin],
    components: {
      ICountUp,
      VFab,
      VProfile,
      VIntelFeed,
      VEventFeed,
      VShimmerMyPost,
      VShimmerFeed,
      VShimmerUserProfile,
      ModalLedgerNano,
      LoginOptions,
      ModalSignIn,
      ModalSplashOnboarding
    },
    data: function () {
      return {
        baseURL: environment.baseURL,
        block: 0,
        etherscanUrl: window.localStorage.getItem('etherscan'),
        information: '',
        loading: true,
        loggedUser: false,
        paretoAddress: window.localStorage.getItem('paretoAddress'),
        primalLoad: false,
        onboarding: false,
        tokenAmount: 1,
        updateContentVar: 0,
        updateHash: 0,
        user: {
          rank: 0,
          score: 0,
          tokens: 0
        }
      };
    },
    computed: {
      ...mapState([
        'address',
        'ws',
        'signType',
        'pathId',
        'makingLogin',
        'showModalSign',
        'showModalLoginOptions',
        'showModalLedgerNano',
        'showModalOnboarding',
        'signalWs'])
    },
    mounted: function () {
      AuthService.auth(() => {
        this.main();
        this.loggedUser = true;
      }, () => {
        this.information = information;
        this.loggedUser = false;
        this.primalLoad = true;

        this.user = information.user;
        //this.onboarding = require('../assets/images/user_placeholder.png');
      });
    },
    methods: {
      ...mapMutations(['intelEnter', 'iniWs', 'iniSignalWs']),
      creatorRoute(address) {
        return '/intel/' + address + '/';
      },
      loadAddress: function () {
        if (!this.user.address) {
          return dashboardService.getAddress(
                  res => {
                    this.user.address = res;
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
        }
      },
      numberToScientificNotation(number) {
        return (number + '').length > 12 ? number.toExponential(5) : number;
      },
      overrideOnMessage() {
        this.ws.onmessage = (data) => {
          try {
            const info = JSON.parse(data.data);

            if (info.data.address) {
              this.user.score = info.data.score;
              this.user.rank = info.data.rank;
              this.user.tokens = info.data.tokens;
              //this.user.block = info.data.block;
              this.block = info.data.block;
            }

            if (info.data.action) {
              switch (info.data.action) {
                case 'updateContent':
                  this.updateContentVar++;
                  break;
                case 'updateHash' :
                  if (info.data.data.event === 'reward') {
                    this.user.rankUpdated = true;
                  }
                  this.updateHash++;
                  break;
              }
            }
          } catch (e) {
            errorService.sendErrorMessage('f32', e);
            console.log(e);
          }
        };
      },
      socketConnection() {
        let params = {rank: this.user.rank, limit: 100, page: this.user.page};
        if (!this.ws) {
          this.iniWs();
          this.ws.onopen = () => {
            this.ws.send(JSON.stringify(params));
          };
        }
      },
      loadProfile: function () {
        return profileService.getProfile(
          res => {
            this.user = res;
            this.block = res.block;
            profileService.generateAndSendSignedKeys(response => {},
            err => {
              console.log(err);
            });
            profileService.getKeysForAllProfiles(res => {
              profileService.generateGroupKeys(
                (groupKeys) => {
                  const Proteus = require('proteus-hd');
                  const base64js = require('base64-js');
                  for (var user in res) {
                    if (!this.signalWs) {
                      this.iniSignalWs();
                    }
                    const ident = Proteus.keys.IdentityKeyPair.deserialise(
                            base64js.toByteArray(localStorage.getItem("identityKeys")).buffer
                    );
                    this.signalWs.onmessage = (response) => {
                      try {
                        // class PreKeyStore
                        class PreKeyStore extends Proteus.session.PreKeyStore {
                          constructor(prekeys) {
                            super();
                            this.prekeys = prekeys;
                          }

                          get_prekey(prekey_id) {
                            return new Promise((resolve, reject) => {
                              resolve(this.prekeys[prekey_id]);
                            });
                          }

                          remove(prekey_id) {
                            return new Promise((resolve, reject) => {
                              delete this.prekeys[prekey_id];
                              resolve();
                            });
                          }
                        }
                        // decrypt message
                        const data = JSON.parse(response.data);
                        if(data.type == 'sendGroupKeys'){
                          const preKey = Proteus.keys.PreKey.deserialise(
                                  base64js.toByteArray(localStorage.getItem("preKey")).buffer
                          );

                          const store = new PreKeyStore([preKey]);
                          const envelope = Proteus.message.Envelope.deserialise(
                                  base64js.toByteArray(data.groupKeys).buffer
                          );
                          Proteus.session.Session.init_from_message(ident, store, envelope)
                          .then((msgArray) => {
                            const [session, message] = msgArray;
                            const serialicedBundleKey = (new TextDecoder()).decode(message);
                            data.groupKeys = serialicedBundleKey;
                            profileService.storeGroupKeys(data);
                          });
                        }

                      } catch (e) {
                        console.log(e);
                      }
                    }
                    if(this.signalWs.readyState === WebSocket.OPEN){
                      const toBundleUser = Proteus.keys.PreKeyBundle.deserialise(
                              base64js.toByteArray(localStorage.getItem(res[user].address)).buffer
                      );
                      Proteus.session.Session.init_from_prekey(ident, toBundleUser)
                      .then((session) => {
                        var encryptedGroupKeys = null;
                        // is valid libsignal session
                        if(session.session_states[0].recv_chains.length === 1){
                          encryptedGroupKeys = session.encrypt(groupKeys).then(
                              (envelope) => {
                                const serializedEnv = envelope.serialise();
                                const encodedSerializedEnv = base64js.fromByteArray(new Uint8Array(serializedEnv));
                                this.signalWs.send(JSON.stringify({
                                  toAddress: res[user].address,
                                  groupKeys: encodedSerializedEnv,
                                  type: "sendGroupKeys",
                                  address: this.user.address,
                                }));
                              }
                          );
                        }
                      });
                    }
                  }
                }
              );
            }, er => {});
          },
          error => {
            console.log('Could not retrieve profile ', error);
          }
        );
      },
      showModal() {
        this.$store.state.showModalLoginOptions = true;
      },
      showModalSplash() {
        this.$store.state.showModalOnboarding = true;
      },
      hideModal() {
        this.$refs.loginOptions.hide();
      },
      requestCall: function () {
        Promise.all([
          this.loadProfile()
        ]).then(values => {
          this.$store.state.makingRequest = false;
        });
      },
      main: function () {
        profileService.updateConfig(res => {
          this.etherscanUrl = window.localStorage.getItem('etherscan');
        });
        this.$store.state.makingRequest = true;
        if (!this.madeLogin) {
          this.intelEnter();
          AuthService.postSign(
                  (res) => {
                    this.primalLoad = true;
                    this.socketConnection();
                    this.requestCall();
                    this.signalSocketMessage(res);
                  },
                  () => {
                    this.primalLoad = true;
                    this.socketConnection();
                    this.requestCall();
                    this.signalSocketMessage();
                  }
          );
        } else {
          this.primalLoad = true;
          this.socketConnection();
          this.requestCall();
          this.signalSocketMessage();
        }
      },
      socketSignalConnection() {
        if (!this.signalWs) {
          this.iniSignalWs();
        }
      },
      signalSocketMessage(params) {
        this.socketSignalConnection();
        let wss = this.signalWs;
        this.signalWs.onopen = function open() {
          wss.send(JSON.stringify({address: params.address, type: 'registration'}));
        };
      }
    }
  };
</script>

<style scoped lang="scss">
  .blocking-content {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    z-index: 99
  }
</style>

<template>
    <div>
        <notifications group="auth" position="bottom right"/>
        <b-modal ref="ledgerNano"
                 centered
                 @hide="onClosedModal"
                 :body-bg-variant="'dark'"
                 :body-text-variant="'light'"
                 hide-header
                 hide-footer>

            <b-container fluid>
                <h2 class="font-body"> Ledger Wallet Nano S </h2>
                <hr>
                <div class="text-left">
                    <p> Before SignIn with Ledger Nano S, verify the next items: </p>
                    <div class="m-2 ml-4">
                        <ul>
                            <li> The Browser must be Google Chrome </li>
                            <li> Plugged-in their Ledger Wallet Nano S </li>
                            <li> Input digits pin </li>
                            <li> Navigated to the Ethereum app on their device </li>
                            <li> Enabled 'browser' support from the Ethereum app settings </li>
                        </ul>
                    </div>
                    <br/>

                    <b-row>
                        <div class="ml-3 mb-2">
                            <p v-if="!supported" class="text-danger"> Your browser does not support this feature </p>
                            <p v-else class="text-primary"> Choose a HD path: </p>
                        </div>
                    </b-row>
                    <b-form-group>
                        <b-form-radio-group v-model="selectedPath">
                            <b-row class="m-2 mt-4">
                                <div class="col-md-3 mb-2 p-0">
                                    <b-form-radio :disabled="!supported" v-on:change="onPathSelected('s44\'/60\'/0\'/0/0')" value="s44'/60'/0'/0/0">
                                        <div class="modal-input-inline">
                                            <p> STANDARD </p> <p>"44'/60'/0'/0/0"</p>
                                        </div>
                                    </b-form-radio>
                                </div>
                                <div class="offset-md-1 ml-md-5 col-md-7 p-0">
                                    <b-form-select id="standard"
                                                   v-model="selectedAddress"
                                                   :disabled="!supported"
                                                   class="mb-3">
                                    </b-form-select>
                                </div>
                            </b-row>

                            <b-row class="m-2 mt-4">
                                <div class="col-md-3 mb-2 p-0">
                                    <b-form-radio :disabled="!supported" v-on:change="onPathSelected('l44\'/60\'/0\'/0')" value="l44'/60'/0'/0">
                                        <div class="modal-input-inline">
                                            <p> LEGACY </p> <p>"44'/60'/0'/0"</p>
                                        </div>
                                    </b-form-radio>
                                </div>
                                <div class="offset-md-1 ml-md-5 col-md-7 p-0">
                                    <b-form-select id="legacy"
                                                   v-model="selectedAddress"
                                                   :disabled="!supported"
                                                   class="mb-3" >
                                    </b-form-select>
                                </div>
                            </b-row>

                            <b-row class="m-2 mt-4">
                                <div class="col-12 col-md-4 mb-2 p-0">
                                    <b-form-radio :disabled="!supported" v-on:change="onPathSelected('custom')" v-bind:value="customPath">
                                        <b-form-input
                                                :disabled="!supported"
                                                v-model="customPath"
                                                id="form-custom-input"
                                                class="p-1"
                                                type="text"
                                                placeholder="CUSTOM"></b-form-input>
                                    </b-form-radio>
                                </div>
                                <div class="col-12 ml-md-3 col-md-7 p-0">
                                    <b-form-select id="custom"
                                                   :disabled="!supported" class="mb-3"/>
                                </div>
                                <div class="col-12">
                                    <p v-if="selectedPath === customPath && customPathError" class="text-danger"> The written path doesn't have any addresses: </p>
                                </div>
                            </b-row>

                            <b-row>
                                <div class="col-12 col-md-4 mb-2 p-0">
                                    <p> Preview  </p>
                                    <p> Path: {{selectedPath}} Address: {{selectedAddress}} </p>
                                </div>
                            </b-row>

                        </b-form-radio-group>
                    </b-form-group>
                </div>
            </b-container>

            <b-row class="m-2 mt-4 float-right">
                <b-btn size="sm" class="mx-2" variant="danger" @click="onClosedModal">Cancel</b-btn>
                <b-btn size="sm" :disabled="!selectedAddress || (customPathError && selectedPath === customPath)" variant="success" @click="hardware(); onClosedModal();">Continue</b-btn>
            </b-row>
        </b-modal>
    </div>
</template>

<script>
    import authService from "../../services/authService";
    import { mapMutations } from 'vuex';

    export default {
        name: 'ModalLedgerNano',
        components: {},
        data(){
            return {
                supported : true,
                selectedPath: null,
                selectedAddress: '',
                customPath: '',
                customPathError : true,
                timer : {},
                paths: [
                    {
                        name: 'standard',
                        id: "s44'/60'/0'/0/0",
                        address: {
                        }
                    },
                    {
                        name: 'legacy',
                        id: "l44'/60'/0'/0",
                        address: {
                        }
                    },
                    {
                        name: 'custom',
                        id: "44'/60'/10'/0",
                        address: {
                        }
                    }
                ]
            };
        },
        watch: {
          'customPath' : function (cpath) {
              this.selectedPath = this.customPath;

              this.customPathError = false;
              if (this.timer) {
                  clearTimeout(this.timer);
                  this.timer = null;
              }
              this.timer = setTimeout(() => {
                  let page = 0, limit = 10;
                  authService.getWalletAccounts(cpath, page, limit, data =>{
                      console.log(data);

                      const select = $('#custom');
                      select.find('option')
                          .remove()
                          .end();

                      let list = Object.values(data);
                      let option = '';

                      list.forEach(item => {
                          option += '<option value="' + item + '">' + item + '</option>';
                      });
                      select.append(option);

                      this.customPathError = false;

                  }, error => {
                      this.customPathError = true;
                  });
              }, 800);
          }
        },
        mounted(){
            this.$refs.ledgerNano.show();
            this.fillPathAddress();
            //this.onPathSelected('44\'/60\'/0\'/0/0', 'standard', this.standard)
            // this.supportedNav();
        },
        methods: {
            fillPathAddress: function() {
                let page = 0, limit = 10;

                this.paths.forEach(path => {

                    if(path.name === 'custom') return;
                    let myPath = path.id.substr(1);

                    authService.getWalletAccounts(myPath, page, limit, data=>{
                        console.log(data);

                        path.address = data;

                        this.selectedPath = path.id;
                        this.onPathSelected(this.selectedPath);

                        const select = $('#' + path.name);
                        const list = Object.values(path.address);

                        let option = '';
                        list.forEach( item => {
                            option += '<option value="'+ item + '">' + item + '</option>';
                        });
                        select.append(option);

                    }, error => {
                        this.$notify({
                            group: 'foo',
                            type: 'error',
                            duration: 10000,
                            text: error });
                    });
                });
            },
            onClosedModal: function () {
                this.$store.state.showModalLedgerNano = false;
            },
            collapseContent: function () {
                if ($(window).width() < 990) {
                    $('#navbarSupportedContent').collapse('toggle');
                }
            },
            onPathSelected : function(path){
                this.selectedAddress = '';
                this.selectedPath = path;

                if(path === 'custom') {
                    this.selectedPath = this.customPath;
                    return;
                }

                this.paths.forEach( path => {
                   if (path.id === this.selectedPath){
                       this.selectedAddress = path.address[0];
                   }
                });
            },
            hardware: function () {
                console.log(this.selectedAddress);
                console.log(this.selectedPath);

                return;
                this.loadingLogin();
                authService.signWallet( path, data => {
                    this.$store.dispatch({
                        type: 'login',
                        address: data,
                    });
                    this.collapseContent();
                    this.$router.push('/intel');
                }, error => {
                    this.stopLogin();
                    this.$notify({
                        group: 'foo',
                        type: 'error',
                        duration: 10000,
                        text: error });
                });
            },
            supportedNav : function () {
                authService.isWalletSupported(data => {
                    if(data){
                        this.supported = true;
                    }
                }, error => {
                    this.supported = false;
                });
            },
            ...mapMutations({
                loginVuex: 'login',
                loadingLogin: 'loadingLogin',
                stopLogin: 'stopLogin',
                logoutVuex: 'logout'
            })
        }
    }
</script>

<style>
    .modal-input-inline{
        margin-top: -15px;
    }

    ::placeholder {
        color: red;
        opacity: 1; /* Firefox */
    }

    :-ms-input-placeholder { /* Internet Explorer 10-11 */
        color: red;
    }

    ::-ms-input-placeholder { /* Microsoft Edge */
        color: red;
    }

    input#form-custom-input {
        color: white;
        border: none;
        background: transparent;
        border-bottom: 1px solid #fff;
    }
</style>
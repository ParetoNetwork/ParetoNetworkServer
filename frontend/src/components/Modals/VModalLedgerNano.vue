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
                            <li> The Browser must be Google Chrome</li>
                            <li> Plugged-in their Ledger Wallet Nano S</li>
                            <li> Input digits pin</li>
                            <li> Navigated to the Ethereum app on their device</li>
                            <li> Enabled 'browser' support from the Ethereum app settings</li>
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
                                    <b-form-radio :disabled="!supported"
                                                  v-on:change="onPathSelected('s44\'/60\'/0\'/0/0')"
                                                  value="s44'/60'/0'/0/0">
                                        <div class="modal-input-inline">
                                            <p> STANDARD </p>
                                            <p>"44'/60'/0'/0/0"</p>
                                        </div>
                                    </b-form-radio>
                                </div>
                                <div class="offset-md-1 ml-md-5 col-md-7 p-0">
                                    <b-form-select id="standard"
                                                   v-on:change="onAddresSelected('s44\'/60\'/0\'/0/0')"
                                                   v-model="selectedAddress"
                                                   :disabled="!supported"
                                                   class="mb-3 ledger-select">
                                    </b-form-select>
                                </div>
                            </b-row>

                            <b-row class="m-2 mt-4">
                                <div class="col-md-3 mb-2 p-0">
                                    <b-form-radio :disabled="!supported"
                                                  v-on:change="onPathSelected('l44\'/60\'/0\'/0')"
                                                  value="l44'/60'/0'/0">
                                        <div class="modal-input-inline">
                                            <p> LEGACY </p>
                                            <p>"44'/60'/0'/0"</p>
                                        </div>
                                    </b-form-radio>
                                </div>
                                <div class="offset-md-1 ml-md-5 col-md-7 p-0">
                                    <b-form-select id="legacy"
                                                   v-on:change="onAddresSelected('l44\'/60\'/0\'/0')"
                                                   v-model="selectedAddress"
                                                   :disabled="!supported"
                                                   class="mb-3 ledger-select">
                                    </b-form-select>
                                </div>
                            </b-row>

                            <b-row class="m-2 mt-4">
                                <div class="col-12 col-md-4 mb-2 p-0">
                                    <b-form-radio :disabled="!supported" v-on:change="onPathSelected('custom')"
                                                  v-bind:value="customPath">
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
                                                   :disabled="!supported" class="mb-3 ledger-select"/>
                                </div>
                                <div class="col-12">
                                    <p v-if="selectedPath === customPath && customPathError" class="text-danger"> The
                                        written path doesn't have any addresses: </p>
                                    <i v-if="loadingCustomPath" class="fa fa-spinner fa-spin ml-2"></i>
                                </div>
                            </b-row>

                            <b-row>
                                <div class="col-12 col-md-4 mb-2 p-0">
                                    <p> Preview </p>
                                    <p> Path: {{selectedPath}} Address: {{selectedAddress}} </p>
                                </div>
                            </b-row>

                        </b-form-radio-group>
                    </b-form-group>
                </div>
            </b-container>

            <b-row class="m-2 mt-4 float-right">
                <b-btn size="sm" class="mx-2" variant="danger" @click="onClosedModal">Cancel</b-btn>
                <b-btn size="sm" :disabled="!selectedAddress || (customPathError && selectedPath === customPath)"
                       variant="success" @click="hardware(); onClosedModal();">Continue
                </b-btn>
            </b-row>
        </b-modal>
    </div>
</template>

<script>
    import authService from "../../services/authService";
    import {mapMutations} from 'vuex';

    export default {
        name: 'ModalLedgerNano',
        components: {},
        data() {
            return {
                supported: true,
                selectedPath: null,
                selectedAddress: '',
                customPath: '',
                customPathError: true,
                loadingCustomPath : false,
                timer: {},
                paths: [
                    {
                        name: 'standard',
                        id: "s44'/60'/0'/0/0",
                        address: {},
                        addressTry: ['0xcceba5addf6504d257c4f55aeb8c329c2e88c080',
                            '0x22741e8ee26e83aacbf098a31de5af1b1231920e',
                            '0x2d0b45741132cb5a6f01ec870aed6a09b95a3210'
                        ]
                    },
                    {
                        name: 'legacy',
                        id: "l44'/60'/0'/0",
                        address: {},
                        addressTry: [
                            '0x1cd35769e5e5e03493dc532bddd0d94f5a8723b2',
                            '0x439531e19d7cbe8999ef00bf2184cba1c19ccb13'
                        ]
                    },
                    {
                        name: 'custom',
                        id: "44'60/1",
                        addressTry: ['0x208f456b28cf6d36d6fc4942a65f4a9089ad68e1',
                            '0x7fb7a2bfe7c29d4ce3a22f82df165c3eb8b6f6e4'
                        ]
                    }
                ]
            };
        },
        watch: {
            'customPath': function (cpath) {
                $('#custom').find('option')
                        .remove()
                        .end();

                this.selectedPath = this.customPath;
                this.loadingCustomPath = true;
                this.customPathError = false;
                if (this.timer) {
                    clearTimeout(this.timer);
                    this.timer = null;
                }
                this.timer = setTimeout(() => {
                    let page = 0, limit = 10;
                    // authService.getWalletAccounts(cpath, page, limit, data => {
                    //     console.log(data);
                    //
                    //     const select = $('#custom');
                    //     select.find('option')
                    //         .remove()
                    //         .end();
                    //
                    //     let list = Object.values(data);
                    //     let option = '';
                    //
                    //     list.forEach(item => {
                    //         option += '<option value="' + item + '">' + item + '</option>';
                    //     });
                    //     select.append(option);
                    //
                    //     this.customPathError = false;
                    //
                    // }, error => {
                    //     this.customPathError = true;
                    // });
                    let foundAddress = false;
                    this.paths.forEach(path => {
                        if (path.id === cpath) {
                            foundAddress = true;
                            const select = $('#custom');
                            const list = path.addressTry;
                            this.selectedPath = path.id;
                            this.onPathSelected(this.selectedPath);
                            let option = '';
                            list.forEach(item => {
                                option += '<option value="' + item + '">' + item + '</option>';
                            });
                            select.append(option);
                        }
                    });

                    if(!foundAddress){
                        this.customPathError = true;
                    }
                    this.loadingCustomPath = false;

                }, 800);
            }
        },
        mounted() {
            this.$refs.ledgerNano.show();
            this.fillPathAddress();
            //this.getAddressesTokens();
            //this.onPathSelected('44\'/60\'/0\'/0/0', 'standard', this.standard)
            // this.supportedNav();
        },
        methods: {
            getAddressesTokens : function(){
                authService.getTokens([,
                ], data =>{
                   console.log(data);
                }, error => {
                    console.log(error);
                });
            },
            fillPathAddress: function () {
                let page = 0, limit = 10;

                this.paths.forEach(path => {
                    if (path.name === 'custom') return;
                    const select = $('#' + path.name);
                    const list = path.addressTry;

                    authService.getTokens( list , data =>{
                        let userList = data.data;

                        userList = userList.map( user=> {
                            return user.address + '  ' + user.tokens;
                        });

                        this.selectedPath = path.id;
                        this.onPathSelected(this.selectedPath);
                        let option = '';
                        userList.forEach(item => {
                            option += '<option value="' + item + '">' + item + '</option>';
                        });
                        select.append(option);

                    }, error => {
                        console.log(error);
                    });

                    // this.selectedPath = path.id;
                    // this.onPathSelected(this.selectedPath);
                    // let option = '';
                    // list.forEach(item => {
                    //     option += '<option value="' + item + '">' + item + '</option>';
                    // });
                    // select.append(option);
                });
                // this.paths.forEach(path => {
                //
                //     if(path.name === 'custom') return;
                //     let myPath = path.id.substr(1);
                //
                //     authService.getWalletAccounts(myPath, page, limit, data=>{
                //         console.log(data);
                //
                //         path.address = data;
                //
                //         this.selectedPath = path.id;
                //         this.onPathSelected(this.selectedPath);
                //
                //         const select = $('#' + path.name);
                //         const list = Object.values(path.address);
                //
                //         let option = '';
                //         list.forEach( item => {
                //             option += '<option value="'+ item + '">' + item + '</option>';
                //         });
                //         select.append(option);
                //
                //     }, error => {
                //         this.$notify({
                //             group: 'foo',
                //             type: 'error',
                //             duration: 10000,
                //             text: error });
                //     });
                // });
            },
            onClosedModal: function () {
                this.$store.state.showModalLedgerNano = false;
            },
            collapseContent: function () {
                if ($(window).width() < 990) {
                    $('#navbarSupportedContent').collapse('toggle');
                }
            },
            onPathSelected: function (path) {
                this.selectedAddress = '';
                this.selectedPath = path;

                if (path === 'custom') {
                    this.selectedPath = this.customPath;
                    return;
                }

                this.paths.forEach(path => {
                    if (path.id === this.selectedPath) {
                        console.log(path.addressTry[0]);
                        this.selectedAddress = path.addressTry[0];
                        // this.selectedAddress = path.address[0];
                    }
                });
            },
            onAddresSelected(path) {
                this.selectedPath = path;
            },
            hardware: function () {
                console.log(this.selectedAddress);
                console.log(this.selectedPath);

                return;
                this.loadingLogin();
                authService.signWallet(path, data => {
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
                        text: error
                    });
                });
            },
            supportedNav: function () {
                authService.isWalletSupported(data => {
                    if (data) {
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
    .modal-input-inline {
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

    .ledger-select{
        padding-left: 1px !important;
        padding-right: 3px !important;
        font-size: 12px;
    }
</style>
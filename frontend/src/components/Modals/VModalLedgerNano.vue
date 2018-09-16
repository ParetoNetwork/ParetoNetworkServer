<template>
    <div>
        <notifications group="auth" position="bottom right"/>
        <b-modal ref="ledgerNano"
                 id="mymodalsito"
                 size="lg"
                 centered
                 @hide="onClosedModal"
                 :body-bg-variant="'dark'"
                 :body-text-variant="'light'"
                 hide-header
                 hide-footer
        >

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
                                    <b-form-radio :disabled="!supported || !paths[0].address"
                                                  v-on:change="onAddresSelected('s44\'/60\'/0\'/0/0', paths[0].address[0], 0)"
                                                  value="s44'/60'/0'/0/0">
                                        <div class="modal-input-inline">
                                            <p> STANDARD </p>
                                            <p class="ledger-path-text">44'/60'/0'/<b>0/0</b></p>
                                        </div>
                                    </b-form-radio>
                                </div>

                                <div class="btn-group offset-md-1 ml-md-4 col-md-8 dropdown-row custom-group">
                                    <b-dropdown :disabled="!supported || !paths[0].address" variant="link" size="lg" no-caret>
                                        <template slot="text">
                                            <div class="d-flex justify-content-between">
                                                <span class="span-ellipsis"> {{paths[0].selected.address}} </span>
                                                <span> {{ parseInt(paths[0].selected.tokens || '0')}} PARETO <i
                                                        class="fa fa-sort-down"></i> </span>
                                            </div>
                                        </template>
                                        <b-dropdown-item v-for="user in paths[0].address"
                                                         @click="onAddresSelected('s44\'/60\'/0\'/0/0', user, 0)">
                                            <div class="d-flex justify-content-between">
                                                <span class="span-ellipsis"> {{user.address}} </span>
                                                <span> {{parseInt(user.tokens || '0')}} PARETO</span>
                                            </div>
                                        </b-dropdown-item>
                                    </b-dropdown>

                                    <div class="address-controls">
                                        <div v-if="!paths[0].selected.address" class="address-disabled">
                                            <i class="fa fa-copy"></i> <i class="fa fa-external-link"></i>
                                        </div>
                                        <div v-else>
                                            <!-- consider clipboard.js or normal js <i class="fa fa-copy"></i> --> <a href={{"https://etherscan.io/address/"+paths[0].selected.address}}><i class="fa fa-external-link"></i></a>
                                        </div>
                                    </div>
                                </div>
                            </b-row>

                            <b-row class="m-2 mt-4">
                                <div class="col-md-3 mb-2 p-0">
                                    <b-form-radio :disabled="!supported || !paths[1].address"
                                                  v-on:change="onAddresSelected('l44\'/60\'/0\'/0', paths[1].address[0], 1)"
                                                  value="l44'/60'/0'/0">
                                        <div class="modal-input-inline">
                                            <p> LEGACY </p>
                                            <p class="ledger-path-text">44'/60'/0'<b>/0</b></p>
                                        </div>
                                    </b-form-radio>
                                </div>

                                <div class="btn-group offset-md-1 ml-md-4 col-md-8 dropdown-row custom-group">
                                    <b-dropdown :disabled="!supported || !paths[1].address" variant="link" size="lg" no-caret>
                                        <template slot="text">
                                            <div class="d-flex justify-content-between">
                                                <span class="span-ellipsis"> {{paths[1].selected.address}} </span>
                                                <span> {{ parseInt(paths[1].selected.tokens || '0')}} PARETO <i
                                                        class="fa fa-sort-down"></i> </span>
                                            </div>
                                        </template>
                                        <b-dropdown-item :disabled="!supported" v-for="user in paths[1].address"
                                                         @click="onAddresSelected('l44\'/60\'/0\'/0', user, 1)">
                                            <div class="d-flex justify-content-between">
                                                <span class="span-ellipsis"> {{user.address}} </span>
                                                <span> {{parseInt(user.tokens || '0')}} PARETO</span>
                                            </div>
                                        </b-dropdown-item>
                                    </b-dropdown>
                                    <div class="address-controls">
                                        <div v-if="!paths[1].selected.address" class="address-disabled">
                                            <i class="fa fa-copy"></i> <i class="fa fa-external-link"></i>
                                        </div>
                                        <div v-else>
                                            <!-- consider clipboard.js or normal js <i class="fa fa-copy"></i> --> <a href={{"https://etherscan.io/address/"+paths[1].selected.address}}><i class="fa fa-external-link"></i></a>
                                        </div>
                                    </div>
                                </div>
                            </b-row>

                            <b-row class="m-2 mt-4">
                                <div class="col-12 col-md-3 mb-2 p-0">
                                    <b-form-radio :disabled="!supported || !paths[0].address"
                                                  v-on:change="onAddresSelected(customPath, paths[2].address[0] || '', 2)"
                                                  v-bind:value="customPath">
                                        <b-form-input
                                                :disabled="!supported"
                                                v-model="customPath"
                                                id="form-custom-input"
                                                class="p-1 ledger-path-text"
                                                type="text"
                                                placeholder="CUSTOM"
                                                style="border-radius: 1px;">
                                        </b-form-input>
                                    </b-form-radio>
                                </div>
                                <div class="btn-group offset-md-1 ml-md-4 col-md-8 dropdown-row custom-group">
                                    <b-dropdown variant="link" size="lg" no-caret :disabled="!paths[2].address">
                                        <template slot="text">
                                            <div class="d-flex justify-content-between">
                                                <span> {{paths[2].selected.address}} </span>
                                                <span> {{ parseInt(paths[2].selected.tokens || '0')}} PARETO <i
                                                        class="fa fa-sort-down"></i> </span>
                                            </div>
                                        </template>
                                        <b-dropdown-item v-for="user in paths[2].address"
                                                         @click="onAddresSelected(customPath, user, 2)">
                                            <div class="d-flex justify-content-between">
                                                <span class="span-ellipsis"> {{user.address}} </span>
                                                <span> {{parseInt(user.tokens || '0')}} PARETO</span>
                                            </div>
                                        </b-dropdown-item>
                                    </b-dropdown>
                                    <div class="address-controls">
                                        <div v-if="!paths[2].selected.address" class="address-disabled">
                                            <i class="fa fa-copy"></i> <i class="fa fa-external-link"></i>
                                        </div>
                                        <div v-else>
                                            <!-- consider clipboard.js or normal js <i class="fa fa-copy"></i> --> <a href={{"https://etherscan.io/address/"+paths[2].selected.address}}><i class="fa fa-external-link"></i></a>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-12">
                                    <p v-if="selectedPath === customPath && customPathError" class="text-danger"> The
                                        written path doesn't have any addresses: </p>
                                    <i v-if="loadingCustomPath || (!paths[0].address && supported) || loadingInfiniteScrollData" class="fa fa-spinner fa-spin ml-2"></i>
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
                title: 'titulo nuevo',
                supported: true,
                selectedPath: null,
                selectedAddress: '',
                customPath: '',
                customPathError: true,
                loadingCustomPath: false,
                loadingInfiniteScrollData: false,
                timer: {},
                paths: [
                    {
                        name: 'standard',
                        id: "s44'/60'/0'/0/0",
                        selected: {},
                        address: '',
                        scroll: {},
                        options: []
                    },
                    {
                        name: 'legacy',
                        id: "l44'/60'/0'/0",
                        selected: {},
                        address: '',
                        scroll: {}
                    },
                    {
                        name: 'custom',
                        selected: {
                            address: ''
                        },
                        address: '',
                        id: "44'60/1",
                        scroll: {}
                    }
                ]
            };
        },
        watch: {
            'customPath': function (cpath) {

                this.selectedPath = this.customPath;
                this.loadingCustomPath = true;
                this.customPathError = false;
                let foundAddress = false;
                if (this.timer) {
                    clearTimeout(this.timer);
                    this.timer = null;
                }
                this.timer = setTimeout(() => {
                    let page = 0, limit = 10;
                    authService.getWalletAccounts(this.customPath, page, limit, data => {

                        foundAddress = true;
                        let addressList = Object.values(data);
                        addressList = addressList.map(address => {
                            return address.toLowerCase();
                        });

                        authService.getTokens(addressList, listData => {
                            let userList = listData.data;

                            this.paths[2].address = addressList.map((address) => {
                                let newAddressToken = {
                                    address: address,
                                    tokens: 0
                                };

                                userList.forEach(item => {
                                    if (item.address == address) {
                                        newAddressToken.tokens = item.tokens;
                                    }
                                });

                                return newAddressToken;
                            });

                            this.paths[2].selected = this.paths[2].address[0];
                            this.selectedAddress = this.paths[2].selected.address;

                        }, error => {
                            console.log(error);
                        });
                    }, error => {
                        this.customPathError = true;
                    });

                    if (!foundAddress) {
                        this.customPathError = true;
                        this.paths[2].selected = '';
                        this.paths[2].address = false;
                    }
                    this.loadingCustomPath = false;

                }, 800);
            }
        },
        updated: function () {
            this.updated++;
            this.$nextTick(function () {

            });
        },
        beforeDestroy: function (){
            authService.deleteWatchNano();
        },
        mounted() {
            this.$refs.ledgerNano.show();

            let paths = $('.custom-group .dropdown-menu');
            paths = Object.values(paths);

            if (paths) {
                paths.forEach((path, index) => {
                    if (typeof path === 'object') {
                        $(path).on('scroll', () => {
                            this.scrollAddressList(index, path);
                        });
                    }
                });
            }

            this.supportedNav();
        },
        methods: {
            collapseContent: function () {
                if ($(window).width() < 990) {
                    $('#navbarSupportedContent').collapse('toggle');
                }
            },
            fillPathAddress: function () {
                this.getAddress(0, 0, 10);
            },
            getAddress: function(path_id, page, limit){
                let myPath = this.paths[path_id].id.substr(1);
                authService.getWalletAccounts(myPath, page, limit, data => {
                    if(path_id===0){
                        this.getAddress(path_id+1, page, limit);
                    }
                    let addressList = Object.values(data);
                    addressList = addressList.map(address => {
                        return address.toLowerCase();
                    });

                    authService.getTokens(addressList, listData => {

                        let userList = listData.data;

                        this.paths[path_id].address = addressList.map((address) => {
                            let newAddressToken = {
                                address: address,
                                tokens: 0
                            };

                            userList.forEach(item => {
                                if (item.address == address) {
                                    newAddressToken.tokens = item.tokens;
                                }
                            });

                            return newAddressToken;
                        });
                        this.paths[path_id].selected = this.paths[path_id].address[0];

                    }, error => {
                        this.$notify({
                            group: 'foo',
                            type: 'error',
                            duration: 10000,
                            text: error
                        });
                    });

                }, error => {
                    this.$notify({
                        group: 'foo',
                        type: 'error',
                        duration: 10000,
                        text: error
                    });
                });
            },
            hardware: function () {
                let path = (isNaN(this.selectedPath.charAt(0)))? this.selectedPath.substring(1) : this.selectedPath;

                this.loadingLogin();
                authService.signWallet(path, this.selectedAddress, data => {
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
            onClosedModal: function () {
                this.$store.state.showModalLedgerNano = false;
                authService.deleteWatchNano();
            },
            onAddresSelected(path, user, pathsIndex) {
                this.selectedPath = path;
                this.selectedAddress = user.address;
                this.paths[pathsIndex].selected = user;
            },
            scrollAddressList: function (index, path) {
                if (path.scrollTop + path.offsetHeight >= path.scrollHeight && !this.loadingInfiniteScrollData) {
                    this.loadingInfiniteScrollData = true;

                    let page = this.paths[index].address.length / 10;

                    let path = (isNaN(this.selectedPath.charAt(0)))? this.selectedPath.substring(1) : this.selectedPath;

                    authService.getWalletAccounts(path, page, 10, data => {

                        let addressList = Object.values(data);
                        addressList = addressList.map(address => {
                            return address.toLowerCase();
                        });

                        authService.getTokens(addressList, listData => {

                            let userList = listData.data;

                            let newList = addressList.map((address) => {
                                let newAddressToken = {
                                    address: address,
                                    tokens: 0
                                };

                                userList.forEach(item => {
                                    if (item.address == address) {
                                        newAddressToken.tokens = item.tokens;
                                    }
                                });

                                return newAddressToken;
                            });

                            this.paths[index].address = [...this.paths[index].address, ...newList];
                            this.loadingInfiniteScrollData = false;
                        }, error => {
                            this.$notify({
                                group: 'foo',
                                type: 'error',
                                duration: 10000,
                                text: error
                            });
                            this.loadingInfiniteScrollData = false;
                        });

                    }, error => {
                        this.$notify({
                            group: 'foo',
                            type: 'error',
                            duration: 10000,
                            text: error
                        });
                    });
                }
            },
            substringAddress: function (address) {
                if (!address) return '';
                return address.substring(0, 30) + '...' + address.substring(address.length - 5, address.length);
            },
            supportedNav: function () {
                authService.isWalletSupported(data => {
                    if (data) {
                        authService.isLedgerWatched = true;
                        authService.doWhenIsConnected( () => {
                            authService.deleteWatchNano();
                            setTimeout(()=>{this.supported = true;
                            this.fillPathAddress();},500);
                        });
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
    .b-dropdown {
        width: 100%;
    }

    .btn-link {
        width: 100%;
        font-size: 11px !important;
        padding: 2px !important;
        background: white !important;
        text-align: left !important;
        color: gray !important;
        border-radius: 5px !important;
    }

    .dropdown-item {
        padding: 4px !important;
        font-size: 11px;
        font-size: 11px !important;
    }

    .dropdown-row {
        min-height: 45px !important;
    }

    .span-ellipsis {
        width: 50%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

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

    #form-custom-input::placeholder {
        color: #D3D3D3;
    }

    .ledger-select {
        padding-left: 5px !important;
        font-size: 12px !important;
    }

    .ledger-path-text {
        font-size: 12px !important;
    }

    .address-controls {
        font-size: 18px;
        padding-left: 8px;
    }

    .address-disabled {
        color: gray;
    }

    .custom-group .dropdown-menu.show {
        max-height: 100px;
        overflow-y: auto;
        border-radius: 0px;
        padding: 0px;
        margin-top: 0px;
        width: 100%;
    }

</style>
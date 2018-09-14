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
                                            <p class="ledger-path-text">"44'/60'/0'/0/0"</p>
                                        </div>
                                    </b-form-radio>
                                </div>

                                <div class="btn-group offset-md-1 ml-md-4 col-md-8 dropdown-row custom-group">
                                    <b-dropdown :disabled="!supported || !paths[0].address" variant="link" size="lg" no-caret>
                                        <template slot="text">
                                            <div class="d-flex justify-content-between">
                                                <span class="span-ellipsis"> {{substringAddress(paths[0].selected.address)}} </span>
                                                <span> {{ parseInt(paths[0].selected.tokens || '0')}} PARETO <i
                                                        class="fa fa-sort-down"></i> </span>
                                            </div>
                                        </template>
                                        <b-dropdown-item v-for="user in paths[0].address"
                                                         @click="onAddresSelected('s44\'/60\'/0\'/0/0', user, 0)">
                                            <div class="d-flex justify-content-between">
                                                <span class="span-ellipsis"> {{substringAddress(user.address)}} </span>
                                                <span> {{parseInt(user.tokens || '0')}} PARETO</span>
                                            </div>
                                        </b-dropdown-item>
                                    </b-dropdown>
                                </div>
                            </b-row>

                            <b-row class="m-2 mt-4">
                                <div class="col-md-3 mb-2 p-0">
                                    <b-form-radio :disabled="!supported || !paths[1].address"
                                                  v-on:change="onAddresSelected('l44\'/60\'/0\'/0', paths[1].address[0], 1)"
                                                  value="l44'/60'/0'/0">
                                        <div class="modal-input-inline">
                                            <p> LEGACY </p>
                                            <p class="ledger-path-text">"44'/60'/0'/0"</p>
                                        </div>
                                    </b-form-radio>
                                </div>

                                <div class="btn-group offset-md-1 ml-md-4 col-md-8 dropdown-row custom-group">
                                    <b-dropdown :disabled="!supported || !paths[1].address" variant="link" size="lg" no-caret>
                                        <template slot="text">
                                            <div class="d-flex justify-content-between">
                                                <span class="span-ellipsis"> {{substringAddress(paths[1].selected.address)}} </span>
                                                <span> {{ parseInt(paths[1].selected.tokens || '0')}} PARETO <i
                                                        class="fa fa-sort-down"></i> </span>
                                            </div>
                                        </template>
                                        <b-dropdown-item :disabled="!supported" v-for="user in paths[1].address"
                                                         @click="onAddresSelected('l44\'/60\'/0\'/0', user, 1)">
                                            <div class="d-flex justify-content-between">
                                                <span class="span-ellipsis"> {{substringAddress(user.address)}} </span>
                                                <span> {{parseInt(user.tokens || '0')}} PARETO</span>
                                            </div>
                                        </b-dropdown-item>
                                    </b-dropdown>
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
                                                <span> {{substringAddress(paths[2].selected.address)}} </span>
                                                <span> {{ parseInt(paths[2].selected.tokens || '0')}} PARETO <i
                                                        class="fa fa-sort-down"></i> </span>
                                            </div>
                                        </template>
                                        <b-dropdown-item v-for="user in paths[2].address"
                                                         @click="onAddresSelected(customPath, user, 2)">
                                            <div class="d-flex justify-content-between">
                                                <span class="span-ellipsis"> {{substringAddress(user.address)}} </span>
                                                <span> {{parseInt(user.tokens || '0')}} PARETO</span>
                                            </div>
                                        </b-dropdown-item>
                                    </b-dropdown>
                                </div>
                                <div class="col-12">
                                    <p v-if="selectedPath === customPath && customPathError" class="text-danger"> The
                                        written path doesn't have any addresses: </p>
                                    <i v-if="loadingCustomPath || (!paths[0].address && supported) || loadingInfiniteScrollData" class="fa fa-spinner fa-spin ml-2"></i>
                                </div>
                            </b-row>

                            <!--
                            <b-row>
                                <div class="col-12 col-md-4 mb-2 p-0">
                                    <p> Preview </p>
                                    <p> Path: {{selectedPath}} Address: {{selectedAddress}} </p>
                                </div>
                            </b-row>
                            -->

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
                        addressTry: ['0xcceba5addf6504d257c4f55aeb8c329c2e88c080',
                            '0x22741e8ee26e83aacbf098a31de5af1b1231920e',
                            '0x2d0b45741132cb5a6f01ec870aed6a09b95a3210',
                            '0x817a3fbd26277a228fa346dbb99068c04bafe68e',
                            '0x4ab26f50d75c6417ff7b747ff806cf8517e06ea4',
                            '0x428922f0d4a8e9a281f6d895b476d35181652da0',
                            '0xcceba5addf6504d257c4f55aeb8c329c2e88c080',
                            '0x030259b644dbf3d91375f421710e4a6a552851ac',
                            '0xbb71d27eb32a8b39fb26e9995728581f5c8ba9b8',
                            '0x79ae49c1f7264caffd3459c7c500067e761d3df3',
                        ],
                        addressCatch: [
                            '0x4c806f36b383c8d511b534fb9afcb546b176910b',
                            '0xb9f62d73f3453763081898f67309cf9b31bd0694',
                            '0x84a4f61d38226e821b0d9936769e947085f9d672',
                            '0x00442b1a53d9162a283bda57be49dfd7e2354496',
                            '0x13c92469719b73b325d4a2165c914cf1c4b873af',
                            '0x288e55b2f3af18e051b3d4840c04b24c40867e32',
                            '0x01eea8432499e9bb64fb842479bfd26efd06f47a',
                            '0xc828c56df770599c1ab369967920065c70a02865',
                            '0xbd8c1ba04da9e43de4f1db96b3e2cd52cfdf028f',
                            '0x228ff85dcdd817171a9bf2b6c654d698a604066a',
                            '0x473e03aa97a32b96c9c0ddd15116dc8fdde56b7a',
                            '0xf04f681e1e5f128a758ffd8ed0d579d521cc1f20',
                            '0xacd90d7206bf9f1fa5fee430d468c3461b6f1b27'
                        ],
                        options: []
                    },
                    {
                        name: 'legacy',
                        id: "l44'/60'/0'/0",
                        selected: {},
                        address: '',
                        addressTry: [
                            '0x1cd35769e5e5e03493dc532bddd0d94f5a8723b2',
                            '0x439531e19d7cbe8999ef00bf2184cba1c19ccb13',
                            '0x817a3fbd26277a228fa346dbb99068c04bafe68e',
                            '0x4ab26f50d75c6417ff7b747ff806cf8517e06ea4',
                            '0x428922f0d4a8e9a281f6d895b476d35181652da0',
                            '0xcceba5addf6504d257c4f55aeb8c329c2e88c080',
                            '0x030259b644dbf3d91375f421710e4a6a552851ac',
                        ],
                        addressCatch: [
                            '0x4c806f36b383c8d511b534fb9afcb546b176910b',
                            '0xb9f62d73f3453763081898f67309cf9b31bd0694',
                            '0x84a4f61d38226e821b0d9936769e947085f9d672',
                            '0x00442b1a53d9162a283bda57be49dfd7e2354496',
                            '0x13c92469719b73b325d4a2165c914cf1c4b873af',
                            '0x288e55b2f3af18e051b3d4840c04b24c40867e32',
                            '0x01eea8432499e9bb64fb842479bfd26efd06f47a',
                            '0xc828c56df770599c1ab369967920065c70a02865',
                            '0xbd8c1ba04da9e43de4f1db96b3e2cd52cfdf028f',
                            '0x228ff85dcdd817171a9bf2b6c654d698a604066a',
                            '0x473e03aa97a32b96c9c0ddd15116dc8fdde56b7a',
                            '0xf04f681e1e5f128a758ffd8ed0d579d521cc1f20',
                            '0xacd90d7206bf9f1fa5fee430d468c3461b6f1b27'
                        ],
                        scroll: {}
                    },
                    {
                        name: 'custom',
                        selected: {
                            address: ''
                        },
                        address: '',
                        id: "44'60/1",
                        addressTry: ['0x208f456b28cf6d36d6fc4942a65f4a9089ad68e1',
                            '0x7fb7a2bfe7c29d4ce3a22f82df165c3eb8b6f6e4',
                            '0x228ff85dcdd817171a9bf2b6c654d698a604066a',
                            '0x473e03aa97a32b96c9c0ddd15116dc8fdde56b7a',
                            '0xf04f681e1e5f128a758ffd8ed0d579d521cc1f20',
                            '0xacd90d7206bf9f1fa5fee430d468c3461b6f1b27'
                        ],
                        addressCatch: [
                            '0x4c806f36b383c8d511b534fb9afcb546b176910b',
                            '0xb9f62d73f3453763081898f67309cf9b31bd0694',
                            '0x84a4f61d38226e821b0d9936769e947085f9d672',
                            '0x00442b1a53d9162a283bda57be49dfd7e2354496',
                            '0x13c92469719b73b325d4a2165c914cf1c4b873af',
                            '0x288e55b2f3af18e051b3d4840c04b24c40867e32',
                            '0x01eea8432499e9bb64fb842479bfd26efd06f47a',
                            '0xc828c56df770599c1ab369967920065c70a02865',
                            '0xbd8c1ba04da9e43de4f1db96b3e2cd52cfdf028f',
                            '0x228ff85dcdd817171a9bf2b6c654d698a604066a',
                            '0x473e03aa97a32b96c9c0ddd15116dc8fdde56b7a',
                            '0xf04f681e1e5f128a758ffd8ed0d579d521cc1f20',
                            '0xacd90d7206bf9f1fa5fee430d468c3461b6f1b27'
                        ],
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

                    // let foundAddress = false;
                    // this.paths.forEach(path => {
                    //     if (path.id === cpath) {
                    //         foundAddress = true;
                    //         const list = path.addressTry;
                    //         this.selectedPath = path.id;
                    //
                    //         authService.getTokens( list , data =>{
                    //
                    //             let userList = data.data;
                    //             this.paths[2].address = userList.map( user => {
                    //                 return {
                    //                     address : user.address,
                    //                     tokens : user.tokens
                    //                 }
                    //             });
                    //
                    //             this.paths[2].selected = this.paths[2].address[0];
                    //             this.selectedAddress = this.paths[2].selected.address;
                    //
                    //         }, error => {
                    //             console.log(error);
                    //         });
                    //
                    //         //this.onAddresSelected(this.customPath, user, 1)
                    //         // this.onPathSelected(this.selectedPath);
                    //     }
                    // });
                    //
                    // if(!foundAddress){
                    //     this.customPathError = true;
                    //     this.paths[2].selected = '';
                    //     this.paths[2].address = false;
                    // }
                    // this.loadingCustomPath = false;

                }, 800);
            }
        },
        updated: function () {
            this.updated++;
            this.$nextTick(function () {

            });
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
                let page = 0, limit = 10;
                console.log('intento 17');

                this.paths.forEach(path => {
                    console.log(path);

                    if (path.name === 'custom') return;
                    let myPath = path.id.substr(1);

                    authService.getWalletAccounts(myPath, page, limit, data => {

                        let addressList = Object.values(data);
                        addressList = addressList.map(address => {
                            return address.toLowerCase();
                        });

                        authService.getTokens(addressList, listData => {

                            let userList = listData.data;

                            path.address = addressList.map((address) => {
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
                            path.selected = path.address[0];

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
                });

                // this.paths.forEach(path => {
                //     if (path.name === 'custom') return;
                //     const list = path.addressTry;
                //
                //     authService.getTokens( list , data =>{
                //         let userList = data.data;
                //
                //         path.addressTry = userList.map( user => {
                //             return {
                //                 address : user.address,
                //                 tokens : user.tokens
                //             }
                //         });
                //
                //         path.selected = path.addressTry[0];
                //
                //     }, error => {
                //         console.log(error);
                //     });
                // });

            },
            hardware: function () {
                let path = (isNaN(this.selectedPath.charAt(0)))? this.selectedPath.substring(1) : this.selectedPath;
                console.log(this.selectedAddress);
                console.log(path);

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
            },
            onAddresSelected(path, user, pathsIndex) {
                this.selectedPath = path;
                this.selectedAddress = user.address;
                this.paths[pathsIndex].selected = user;
            },
            scrollAddressList: function (index, path) {

                // if(path.scrollTop + path.offsetHeight >= path.scrollHeight){
                //
                //     let page = this.paths[index].addressTry.length/10;
                //     console.log(this.paths[index].addressTry.length);
                //     console.log(page);
                //
                //     let newList = this.paths[index].addressCatch;
                //     authService.getTokens(newList, data=> {
                //
                //         let userList = data.data;
                //
                //         newList = userList.map( user => {
                //             return {
                //                 address : user.address,
                //                 tokens : user.tokens
                //             }
                //         });
                //
                //         if(index > 1)
                //             this.paths[index].address = [...this.paths[index].address, ...newList]
                //         else
                //             this.paths[index].addressTry = [...this.paths[index].addressTry, ...newList]
                //
                //     }, error => {
                //         console.log(error);
                //     });
                //
                // }


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
                        this.supported = true;
                        this.fillPathAddress();
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

    .custom-group .dropdown-menu.show {
        max-height: 100px;
        overflow-y: auto;
        border-radius: 0px;
        padding: 0px;
        margin-top: 0px;
        width: 100%;
    }

</style>
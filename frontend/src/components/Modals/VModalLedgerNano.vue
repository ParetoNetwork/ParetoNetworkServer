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
                    <p> Choose a HD path: </p>
                    <b-form-group>
                        <b-form-radio-group  v-model="selected">
                            <b-row class="m-2 mt-4">
                                <b-form-radio value="44'/60'/0'/0/0">
                                    <div style="margin-top: -15px;">
                                        <h1> Custom </h1> "44'/60'/0'/0/0"
                                    </div>
                                </b-form-radio>
                                <b-form-select v-model="selected" :options="options" class="mb-3" />
                            </b-row>
                            <b-row class="m-2 mt-4">
                                <b-form-radio value="44'/60'/0'/0">
                                    <div style="margin-top: -15px;">
                                        <h1> Legacy </h1> "44'/60'/0'/0"
                                    </div>
                                </b-form-radio>
                            </b-row>
                        </b-form-radio-group>
                    </b-form-group>
                </div>
            </b-container>
            <b-row class="m-2 mt-4 float-right">
                <b-btn size="sm" class="mx-2" variant="danger" @click="onClosedModal">Cancel</b-btn>
                <b-btn size="sm" variant="success" :disabled="!selected"  @click="hardware(selected); onClosedModal();">Continue</b-btn>
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
                selected: "44'/60'/0'/0/0",
                options: [
                    { value: null, text: 'Please select an option' },
                    { value: 'a', text: 'This is First option' },
                    { value: 'b', text: 'Selected Option' },
                    { value: {'C': '3PO'}, text: 'This is an option with object value' },
                    { value: 'd', text: 'This one is disabled', disabled: true }
                ]
            };
        },
        mounted(){
            this.$refs.ledgerNano.show();
        },
        methods: {
            onClosedModal: function () {
                this.$store.state.showModalLedgerNano = false;
            },
            collapseContent: function () {
                if ($(window).width() < 990) {
                    $('#navbarSupportedContent').collapse('toggle');
                }
            },
            hardware: function (path) {
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
            }, ...mapMutations({
                loginVuex: 'login',
                loadingLogin: 'loadingLogin',
                stopLogin: 'stopLogin',
                logoutVuex: 'logout'
            })
        }
    }
</script>
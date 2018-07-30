<template>
    <div>
        <b-modal ref="ledgerNano"
                 centered
                 title="Ledger Wallet Nano S"
                 @hide="onClosedModal"
                 :header-bg-variant="'dark'"
                 :header-text-variant="'light'"
                 :body-bg-variant="'dark'"
                 :body-text-variant="'light'"
                 hide-footer>

            <b-container fluid>
                <div class="text-left">
                    <p> Before SignIn with Ledger Nano S, verify the next items: </p>
                    <div class="m-2 ml-4">
                        <ul>
                            <li> Plugged-in their Ledger Wallet Nano S </li>
                            <li> Input digits pin </li>
                            <li> Navigated to the Ethereum app on their device </li>
                            <li> Enabled 'browser' support from the Ethereum app settings </li>
                        </ul>
                    </div>
                </div>
            </b-container>
            <b-row class="m-2 mt-4 float-right">
                <b-btn size="sm" class="mx-2" variant="danger" @click="onClosedModal">Cancel</b-btn>
                <b-btn size="sm" variant="success" @click="hardware(); onClosedModal();">Continue</b-btn>
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
            hardware: function () {
                this.loadingLogin();
                authService.signWallet(data => {
                    this.$store.dispatch({
                        type: 'login',
                        address: data,
                    });
                    this.collapseContent();
                    this.$router.push('/dashboard');
                }, error => {
                    this.stopLogin();
                    alert(error);
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
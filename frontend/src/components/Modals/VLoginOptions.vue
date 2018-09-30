<template>
    <div>|
        <notifications group="auth" position="bottom right"/>
        <b-modal ref="loginOptions"
                 centered
                 hide-header
                 hide-footer
                 @hide="onClosedModal"
                 :body-bg-variant="'dark'"
                 :body-text-variant="'light'">

            <b-container fluid>
                <h2 class="font-body"> Choose a Login Method</h2>
                <b-form-group>
                    <b-form-radio-group  v-model="selected">
                        <b-row class="m-2 mt-4">
                            <b-form-radio value="MetaMask"> MetaMask </b-form-radio>
                        </b-row>
                        <b-row class="m-2 mt-4">
                            <b-form-radio value="Manually"> Manually </b-form-radio>
                        </b-row>
                        <b-row class="m-2 mt-4">
                            <b-form-radio value="LedgerNano"> Ledger Nano </b-form-radio>
                        </b-row>
                    </b-form-radio-group>
                    <b-row class="m-2 mt-4">
                        <b-button style="background-color: rgb(107, 194, 123)" variant="success" :disabled="!selected" @click="checkLoginOption(selected)"> Login </b-button>
                        <b-button class="ml-2" variant="danger" @click="onClosedModal()"> Cancel </b-button>
                    </b-row>
                </b-form-group>
            </b-container>
        </b-modal>
    </div>

</template>

<script>
    import 'jquery';
    import { mapMutations } from 'vuex';
    import authService from "../../services/authService";
    import dashboardService from "../../services/dashboardService";
    import ModalLedgerNano from "./VModalLedgerNano";

    export default {
        name: 'LoginOptions',
        props: {
            redirectRoute: String
        },
        components: {ModalLedgerNano},
        data(){
            return {
                option: '',
                selected: ''
            };
        },
        mounted: function(){
            this.$refs.loginOptions.show();
        },
        methods: {
            onClosedModal: function () {
                this.$store.state.showModalLoginOptions = false;
            },
            checkLoginOption: function (method) {
                this.onClosedModal();
                this[method]();
            },
            collapseContent: function () {
                if ($(window).width() < 990) {
                    $('#navbarSupportedContent').collapse('toggle');
                }
            },
            MetaMask: function () {
                this.loadingLogin();
                authService.signSplash(data => {
                   // console.log(data);
                    dashboardService.getAddress(res => {
                        this.$store.dispatch({
                            type: 'login',
                            address: res,
                        });
                        this.collapseContent();
                        this.$router.go(this.redirectRoute || '/intel');
                    }, () => {
                        console.log('Metamask Error');
                    });

                }, error => {
                    console.log(error);
                    this.stopLogin();
                    this.$notify({
                        group: 'foo',
                        type: 'error',
                        duration: 10000,
                        text: error });
                });
            },
            Manually: function() {
                this.$store.state.showModalSign = true;
            },
            LedgerNano: function () {
                this.$store.state.showModalLedgerNano = true;
            }
            , ...mapMutations({
                loginVuex: 'login',
                loadingLogin: 'loadingLogin',
                stopLogin: 'stopLogin',
                logoutVuex: 'logout'
            })
        }
    }

</script>

<style lang="css">

    .modal-content {
        border-radius: 15px !important;
    }

    .modal-body {
        border-radius: 11px !important;
    }
</style>
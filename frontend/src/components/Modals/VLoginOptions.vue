
<template>
  <div>|
    <notifications group="auth" position="bottom right"/>
    <b-modal
        ref="loginOptions"
        centered
        hide-header
        hide-footer
        @hide="onClosedModal"
        :body-bg-variant="'dark'"
        :body-text-variant="'light'">

      <b-container fluid>
        <h2 class="font-body"> Choose a Login Method</h2>
        <b-form-group>
          <b-button class="btn btn-dark-primary-pareto mt-2 mb-3"
                    @click="checkLoginOption('MetaMask')"> MetaMask
          </b-button> <br/>
          <b-button class="btn btn-dark-primary-pareto mb-3"
                    @click="checkLoginOption('Manually')"> Manually
          </b-button> <br/>
          <b-button class="btn btn-dark-primary-pareto mb-3"
                    @click="checkLoginOption('LedgerNano')"> Ledger Nano
          </b-button> <br/>

          <b-button class="btn btn-dark-secondary-pareto"
                    @click="onClosedModal()"> Cancel</b-button>
        </b-form-group>
      </b-container>
    </b-modal>
  </div>

</template>

<script>
  import 'jquery';
  import {mapMutations} from 'vuex';
  import authService from "../../services/authService";
  import dashboardService from "../../services/dashboardService";
  import ModalLedgerNano from "./VModalLedgerNano";
  import errorService from "../../services/errorService";

  export default {
    name: 'LoginOptions',
    props: {
      redirectRoute: String
    },
    components: {ModalLedgerNano},
    data() {
      return {
        option: '',
        selected: ''
      };
    },
    mounted: function () {
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
          this.collapseContent();
          this.$router.push(this.redirectRoute || '/intel');
          this.$router.go();
          authService.postSign(
            res => {
              this.$store.dispatch({
                type: 'login',
                address: {address: res.address, dataSign: {signType: 'Metamask', pathId: ''}},
              });
            },
          );
        }, error => {
          this.stopLogin();
          let errorText = error.message ? error.message : error;
          this.$notify({
            group: 'notification',
            type: 'error',
            duration: 10000,
            title: 'Login',
            text: errorService.sendErrorMessage('f1', errorText)
          });

          this.stopLogin();
        });
      },
      Manually: function () {
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
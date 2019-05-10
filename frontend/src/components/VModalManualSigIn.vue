<template>
  <div class="modal fade" id="signModal" role="dialog">
    <notifications group="auth" position="bottom right"/>
    <div class="modal-dialog" role="document">
      <div class="modal-content bg-dark text-light">
        <div class="modal-header">
          <h2 class="font-body">Manual Sign in</h2>
          <button type="button" class="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body form-horizontal ">
          <form class="form-horizontal" role="form">
            <div class="form-group">
              <label for="addresstemp" class="control-label col-xs-2">Address</label>
              <div class="col-xs-10">
                <input type="text" v-model="addresstemp" class="form-control" id="addresstemp">
              </div>
            </div>
            <div class="form-group">
              <label for="message" class="control-label col-xs-2">Message</label>
              <div class="col-xs-10">
                <input type="text" v-model="message" class="form-control" id="message" disabled>
              </div>
            </div>
            <div class="form-group">
              <label for="signed" class="control-label col-xs-2">Signed Message</label>
              <div class="col-xs-10">
                <input type="text" v-model="signed" class="form-control" id="signed">
              </div>
            </div>

          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-success" @click="manualLogin"
                  style="background-color: rgb(107, 194, 123);">Sign In
          </button>
          <button type="button" class="btn btn-danger" data-dismiss="modal" @click="modalcancel">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>


<script>
  /* eslint-disable */
  import 'jquery'
  import Auth from '../services/authService';
  import {mapState, mapMutations} from 'vuex';

  export default {
    name: 'ModalSignIn',
    components: {},
    computed: {...mapState(['makingLogin'])},
    data() {
      return {
        loading: false,
        message: "Pareto Network",
        addresstemp: "",
        signed: ""
      };
    },
    mounted() {
      $('#signModal').modal({show: true, backdrop: true}).on('hidden.bs.modal', e => {
        this.$store.state.showModalSign = false;
        $('#signModal').modal('dispose');
      })
    },
    beforeDestroy() {
      $('#signModal').modal('hide');
    },
    methods: {
      manualLogin: function () {
        this.loadingLogin();
        Auth.manualLogin(this.addresstemp, this.message, this.signed, res => {
          this.$store.state.showModalSign = false;
          $('#signModal').modal('hide');
          this.$router.push('/intel');
          this.$router.go();

          Auth.postSign(
            res => {
              this.$store.dispatch({
                type: 'login',
                address: {address: res, dataSign: {signType: 'Manual', pathId: ''}},
              });
            },
          );
        }, error => {
          $('#signModal').modal('hide');
          this.stopLogin();
          let errorText = error.message ? error.message : error;
          this.$notify({
            group: 'notification',
            type: 'error',
            duration: 10000,
            text: errorText
          });
        });
      },
      modalcancel() {
        $('#signModal').modal('hide');
        this.$store.state.showModalSign = false;
      }
      , ...mapMutations(
        ['login', 'loadingLogin', 'stopLogin']
      )
    }
  };
</script>

<style lang="scss" scoped>
  .modal-content {
    color: #545454;
    text-align: left;
  }

  .modal-body label {
    display: inline;
    margin-bottom: 0.1rem;
  }

</style>
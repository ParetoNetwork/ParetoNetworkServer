<template>
    <div class="modal fade in" id="signModal"  role="dialog">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Modal title</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body form-horizontal">
                    <form class="form-horizontal" role="form">
                        <div class="form-group">
                            <label for="address" class="control-label col-xs-2">Address</label>
                            <div class="col-xs-10">
                                <input type="text"  v-model="address" class="form-control" id="address">
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="pkey" class="control-label col-xs-2">Private Key</label>
                            <div class="col-xs-10">
                                <input type="text" v-model="privatekey"  class="form-control" id="pkey">
                            </div>
                        </div>

                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" @click="manualLogin" >Sign In</button>
                    <button type="button" class="btn btn-secondary" data-dismiss="modal" @click="modalcancel" >Cancel</button>
                </div>
            </div>
        </div>
    </div>
</template>


<script>
    /* eslint-disable */
    import 'jquery'
    import Auth from '../services/authService';
    import {mapState,mapMutations} from 'vuex';

    export default {
        name: 'ModalSignIn',
        components: {},
        computed: {...mapState(['makingLogin'])},
        data() {
            return {
                loading: false,
                 address: "",
                privatekey: ""
            };
        },
        mounted() {
            $('#signModal').modal({ show: true})
        },
        methods: {
            manualLogin: function () {
                this.loadingLogin();
                Auth.manualLogin( this.address, this.privatekey ,data => {
                    this.$store.dispatch({
                        type: 'login',
                        address: data,
                    });
                    $('#signModal').modal({ show: false});
                    this.$router.push('/dashboard');
                }, error => {
                    $('#signModal').modal({ show: false});
                    this.stopLogin();
                    alert(error);
                });
            },
            modalcancel() {
                $('#signModal').modal({ show: false});
            }
            , ...mapMutations(
                ['login','loadingLogin','stopLogin']
            )
        }
    };
</script>
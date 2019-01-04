<template>
    <div class="pareto-blue-dark">
        <notifications group="auth" position="bottom right"/>
        <div class="container main wrapp pb-5"
             style="min-height: 100vh;">
            <form id="intel"
                  style="margin: 5px;"
                  v-on:submit.prevent
                  @submit="validateContent">
                <div class="mt-5 p-1 text-left">
                    <div class="row mb-md-3">
                        <div class="col-12 p-1">
                            <label class="pareto-label"><b>NEW INTEL</b></label>
                        </div>
                        <div class="col-md-5 col-lg-4 p-1 mb-2">
                            <p class="create-input"> {{blockChainAddress}} </p>
                        </div>
                        <div class="col-md-3 col-lg-2 p-1 mt-4 mt-md-0 create-input-space">
                            <input type="number" class="create-input" step="0.0001" required>
                            <span class="floating-label">Pareto Amount</span>
                        </div>
                    </div>
                    <div class="row  mt-2">
                        <div v-if="!isPreview" class="col-10 font-body p-1 mt-4 mt-md-1">
                            <div class="flex-row create-intel-container">
                                <div class="group create-input-space">
                                    <input id="intel-title-input"
                                           type="text" class="create-input create-content-text"
                                           name="intel-title" v-model="title" required>
                                    <span  class="floating-label create-content-text"><b>Title</b> <span style="color: red">*</span> </span>
                                    <label v-if="formError.title === false" class="pareto-label" style="color: red">
                                        Required Field </label>

                                </div>

                                <textarea id="intel-body-input"
                                          name="editordata"
                                          v-model="body"
                                ></textarea>
                                <label v-if="formError.body === false" class="pareto-label" style="color: red"> Required
                                    Field </label>

                                <div class="d-flex justify-content-center">
                                    <input v-if="intel.state ==='empty'"
                                           class="button bg-white pareto-text-blue mt-2"
                                           style="width:100px; height: 35px; line-height: 32px;"
                                           type="submit"
                                           form="intel"
                                           value="Submit">
                                </div>
                                <div class="d-flex justify-content-center">
                                    <label class="pareto-label"> {{intel.text}}
                                        <i v-if="intel.state === 'creating'" class="fa fa-spinner fa-spin"></i>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div v-if="isPreview" class="col-12 font-body text-left"
                             style="color: #fff; min-height: 80vh;">
                            <label class="pareto-label"><b>Intel Content Preview</b></label>
                            <div id="preview"
                                 style="padding: 5px; color: #000; background-color: rgba(161, 161, 161, 1); width: 100%; height: 95%; min-height: 400px; border: 1px solid #a9a9a9; border-radius: 5px;">
                                <p v-html="body"></p>
                            </div>
                        </div>
                        <div class="col-2">
                            <button> SUBMIT</button>
                            <button> PREVIEW</button>
                        </div>
                    </div>
                </div>
                <div>
                    <b-modal
                            v-model="modalToken"
                            centered
                            hide-header
                            hide-footer
                            @hide="hideModal"
                            :body-bg-variant="'dark'"
                            :body-text-variant="'light'">

                        <b-container fluid>
                            <h4 class="font-body mb-3"> Pareto Amount</h4>
                            <div v-if="this.signType==='LedgerNano'" class="text-left">
                                <p> Before use Ledger Nano S, verify the next items: </p>
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
                            </div>
                            <p class="text-dashboard mb-2" style="font-size: 16px"> You need to deposit Pareto tokens to
                                create Intel. Please input the amount to deposit</p>

                            <b-form-input v-model="tokens"
                                          type="number"></b-form-input>
                            <b-row class="m-2 mt-4 d-flex justify-content-center">
                                <b-button class="mr-2" variant="danger" @click="hideModal()"> Cancel</b-button>
                                <b-button style="background-color: rgb(107, 194, 123)"
                                          :disabled="!hardwareAvailable || parseFloat(tokens)<=0 || parseFloat(tokens) > parseFloat(maxTokens)"
                                          variant="success" @click="createIntel()"> Confirm
                                </b-button>
                            </b-row>
                        </b-container>
                    </b-modal>
                </div>
            </form>
        </div>
    </div>

</template>

<script>
    import DashboardService from '../services/dashboardService';
    import AuthService from '../services/authService';
    import ProfileService from '../services/profileService';
    import ContentService from '../services/ContentService';
    import {mapState, mapActions} from "vuex";

    require('summernote/dist/summernote.css');
    require('summernote');

    export default {
        name: 'VCreateIntel',
        data: function () {
            return {
                nextRoute: {
                    canAsk: true,
                    to: {}
                },
                logged: false,
                block: null,
                body: '',
                hardwareAvailable: false,
                content: '',
                title: '',
                maxTokens: 1,
                blockChainAddress: '',
                tokens: 1,
                intel: {
                    state: 'empty',  // 'creating', 'created'
                    text: '',
                },
                formError: {
                    title: '',
                    body: ''
                },
                modalToken: false,
                modalWaiting: false,
                modalCloseWarning: false,
                isPreview: false
            };
        },
        updated: function () {
            this.$nextTick(function () {
                let edit = $('.note-editable')[0];
                if (edit) {
                    $(edit).keyup(() => {
                        this.body = edit.innerHTML;
                    });
                }
            });
        },
        computed: {
            bodyFunction: function () {
                return content;
            },
            ...mapState(["madeLogin", "ws", "signType", "pathId"])
        },
        mounted: function () {
            $('#intel-body-input').summernote({
                height: 300, // set editor height
                minHeight: null, // set minimum height of editor
                maxHeight: null, // set maximum height of editor
                focus: true, // set focus to editable area after initializing summernote
                link: [
                    ['link', ['linkDialogShow', 'unlink']]
                ],
                toolbar: [
                    ['font', ['bold', 'italic', 'underline' /*, 'clear'*/]],
                    // ['font', ['bold', 'italic', 'underline', 'strikethrough', 'superscript', 'subscript', 'clear']],
                    //['color', ['color']],
                    ['para', [/*'ul', 'ol', */ 'paragraph']],
                    //['height', ['height']],
                    //['table', ['table']],
                    ['insert', ['link', /*'picture',*/]],
                    //['view', ['fullscreen' /*, 'codeview'*/]],
                    //['help', ['help']]
                ],
                popover: {
                    image: [],
                    link: [],
                    air: []
                }
            });
            this.address();
            //ProfileService.updateConfig();
            /*
            window.addEventListener('popstate', function () {
                console.log('new backbutton');
                history.pushState(null, null, document.URL);
                window.prompt()
            });
            */

            this.routeRealod();
        },
        /*beforeRouteLeave(to, from, next) {

            if (this.nextRoute.canAsk && this.intel.state === 'creating') {
                this.modalCloseWarning = true;
                this.nextRoute.to = to;
                next(false);
            } else {
                next();
            }
        },*/
        methods: {
            ...mapActions(["addTransaction", "transactionComplete", "editTransaction"]),
            isAvailable() {
                if (this.signType === 'LedgerNano') {
                    this.hardwareAvailable = false;
                    AuthService.doWhenIsConnected(() => {
                        this.hardwareAvailable = true;
                        AuthService.deleteWatchNano();
                    })
                } else {
                    this.hardwareAvailable = true;
                }
            },
            address: function () {
                DashboardService.getAddress(res => {
                    this.block = res.block;
                    this.blockChainAddress = res.address;
                    this.maxTokens = res.tokens;
                }, () => {

                });
            },
            validateContent: function (e) {

                this.formError.title = !!this.title;
                this.formError.body = this.body.length > 3;

                if (!this.formError.title || !this.formError.body) return;

                this.showModal();
            },
            createIntel: function () {
                this.hideModal();
                //console.log(this.tokens);

                this.intelState('creating', 'Creating Intel, please wait');
                //console.log({block:this.block, title: this.title, body: this.body.innerHTML, address: this.blockChainAddress});

                this.$store.state.makingRequest = true;
                //this.modalWaiting = true;

                ContentService.createIntel(
                    {block: this.block, title: this.title, body: this.body, address: this.blockChainAddress},
                    this.tokens,
                    {signType: this.signType, pathId: this.pathId},
                    {
                        addTransaction: this.addTransaction,
                        transactionComplete: this.transactionComplete,
                        editTransaction: this.editTransaction,
                        toastTransaction: this.$notify
                    },
                    (res) => {
                        this.$store.state.makingRequest = false;
                        this.intelState('created', 'Intel Created!');

                        this.$notify({
                            group: 'notification',
                            type: 'success',
                            duration: 10000,
                            text: 'The Intel was created'
                        });

                        this.modalWaiting = false;

                        //this.$router.push('/intel');
                    }, (err) => {

                        console.log(err);
                        if (err.includes('Transaction was not mined within')) {
                            this.$notify({
                                group: 'notification',
                                type: 'warning',
                                duration: 20000,
                                title: 'Warning!',
                                text: err
                            });
                        } else {
                            this.intelState('empty', '');
                            this.modalWaiting = false;

                            if (typeof err === 'string')
                                err = 'Could not create Intel. ' + err.split('\n')[0];
                            this.$notify({
                                group: 'notification',
                                type: 'error',
                                duration: 20000,
                                text: err || 'Could not create Intel'
                            });

                            this.$store.state.makingRequest = false;
                        }
                    });
            },
            routeLeaving: function () {
                this.nextRoute.canAsk = false;
                this.modalCloseWarning = false;
                this.$router.push(this.nextRoute.to.path);
            },
            routeRealod: function () {
                window.onbeforeunload = function () {
                    if (document.location.href.indexOf('create') !== -1) {
                        return '';
                    } else {
                        return void (0);
                    }
                };
            },
            intelState: function (state, text) {
                this.intel.state = state;
                this.intel.text = text;
            },
            showModal() {
                this.modalToken = true;
                this.isAvailable();
            },
            hideModalWarning: function () {
                this.modalCloseWarning = false;
            },
            hideModal() {
                this.modalToken = false;
                if (this.signType === 'LedgerNano') {
                    AuthService.deleteWatchNano();
                    this.hardwareAvailable = false;
                }
            }
        }
    };
</script>

<style>
    input:focus ~ .floating-label,
    input:not(:focus):valid ~ .floating-label{
        top: -25px;
        bottom: 10px;
        left: 5px;
        font-size: 16px;
    }

    textarea a {
        text-decoration: underline;
        color: blue;
    }

    .note-editable a {
        text-decoration: underline;
        color: blue;
    }

    #preview a {
        text-decoration: underline;
        color: blue;
    }

    @media all and (max-width: 768px) {
        .header-img {
            width: 100px;
        }
    }

    @media all and (max-width: 575px) {
        .header-img {
            width: 90px;
        }
    }

    .create-input-space {
        position: relative;
    }

    .create-input {
        padding: 10px;
        border-radius: 3px;
        border: 0px;
        background-color: #3f7989;
        color: white;
        width: 100%;
    }

    .create-intel-container {
         border-radius: 3px;
         border: 0px;
         background-color: #3f7989;
     }

    .create-content-text {
        font-size: 18px !important;
    }

    .note-editable {
         background: #3f7989!important;
         color: white !important;
         padding: 0px !important;
         padding-top: 20px !important;
     }

    .note-editor.note-frame.panel {
        padding: 10px;
        border: none;
    }

    .note-toolbar.panel-heading {
        padding: 0px;
    }

    .note-editing-area {
        margin-top: 2px;
    }

    .pareto-label {
        color: #ffffff;
        font-size: 18px;
        font-weight: normal;
        pointer-events: none;
        transition: 0.2s ease all;
        -moz-transition: 0.2s ease all;
        -webkit-transition: 0.2s ease all;
    }

    .lookup-input {
        padding: 10px 10px 10px 5px;
        display: block;
        width: 100%;
        border: none;
        background-color: #040f1e;
        border-bottom: 1px solid #757575;
        color: white;
    }

    .floating-label {
        color: white;
        position: absolute;
        pointer-events: none;
        left: 10px;
        top: 10px;
        transition: 0.2s ease all;
        font-size: 14px;
    }
</style>
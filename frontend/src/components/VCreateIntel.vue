<template>
    <div class="pareto-blue-dark">
        <notifications group="auth" position="bottom right"/>
        <div class="container main wrapp pb-5"
             style="min-height: 100vh;">
            <div class="mt-5 p-1 text-left">
                <div class="row mb-md-4">
                    <div class="col-12 p-1">
                        <label class="pareto-label" style="padding-left: 10px"><b>NEW INTEL</b></label>
                    </div>
                    <div class="col-md-6 col-lg-4 p-1 mb-4 mb-md-2">
                        <p class="create-input text-user-content"> {{blockChainAddress}} </p>
                    </div>
                    <div class="col-md-3 col-lg-2 p-1 mt-4 mt-md-0 create-input-space">
                        <input type="number" v-model="tokens" class="create-input" step="0.000000001" required>
                        <span class="floating-label">Pareto Amount
                            <span v-if="formError.tokens && !tokens"> <i class="fa fa-exclamation-circle shake" style="color: red"></i> </span>
                        </span>
                    </div>
                </div>
                <div class="row mt-4 mt-md-2">
                    <div v-show="!isPreview" class="col-lg-10 font-body p-1 mt-4 mt-md-1">
                        <div class="flex-row create-intel-container text-user-content">
                            <div class="group create-input-space">
                                <input id="intel-title-input"
                                       type="text" class="create-input create-content-text title-user-content"
                                       style="font-weight: bolder"
                                       name="intel-title" v-model="title" required>
                                <span class="floating-label create-content-text title-user-content">
                                    <b>Title </b>
                                    <span v-if="formError.title && !title"> <i class="fa fa-exclamation-circle shake"
                                                                     style="color: red"></i></span>
                                </span>
                            </div>
                            <svg height="1" width="100%" class="px-3">
                                <line x1="0" y1="0" x2="100%" y2="0"
                                      style="stroke:rgb(255,255,255);stroke-width:2"/>
                            </svg>
                            <textarea v-show="false"
                                      id="intel-body-input"
                                      name="editordata"
                                      v-model="body">
                            </textarea>
                            <div v-if="intel.state !== 'empty'" class="d-flex justify-content-center">
                                <label class="pareto-label"> {{intel.text}}
                                    <span v-if="intel.state === 'creating'">
                                         <i class="fa fa-spinner fa-spin"></i>
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div v-show="isPreview" class="col-lg-10 font-body p-1 mt-4 mt-md-1">
                        <div class="flex-row create-intel-container">
                            <div class="group create-input-space">
                                <input
                                        type="text"
                                        class="create-input create-content-text"
                                        style="font-weight: bolder"
                                        name="intel-title"
                                        v-model="title" readonly>
                            </div>
                            <svg height="1" width="100%" class="px-3">
                                <line x1="0" y1="0" x2="100%" y2="0"
                                      style="stroke:rgb(255,255,255);stroke-width:2"/>
                            </svg>
                            <div id="preview" class="note-editable text-user-content">
                                <p v-html="body" style="padding-left: 10px;"></p>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-2 d-flex flex-lg-column justify-content-end justify-content-lg-start">
                        <button class="btn btn-dark-secondary-pareto mt-2 order-lg-2"
                                @click="showPreview()">
                            <b v-if="!isPreview">preview</b>
                            <b v-if="isPreview">edit</b>
                        </button>
                        <button
                                class="btn btn-dark-primary-pareto ml-2 ml-lg-0 mt-2 order-lg-1"
                                @click="validateContent()"
                                :disabled="intel.state === 'creating'">
                            <b>submit</b>
                        </button>
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
                        <h4 class="font-body my-3"> CONFIRM PUBLISH </h4>
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

                        <div class="create-input w-100">
                            <div class="d-flex justify-content-start w-100 pr-5 pb-3 modal-input">
                                <span> Address </span>
                                <span class="ml-4 ellipsis"> {{blockChainAddress}} </span>
                            </div>
                        </div>

                        <div class="create-input w-100 mt-3">
                            <div class="d-flex justify-content-start w-100 pr-5 pb-3 modal-input">
                                <span> Deposit </span>
                                <span class="ml-4">
                                    <img src="../assets/images/LogoMarkColor.svg" width="20px" alt="" class="mr-2">
                                    {{tokens}}
                                </span>
                            </div>
                        </div>

                        <b-row class="m-2 mt-4 d-flex justify-content-end">
                            <button
                                    class="btn btn-dark-primary-pareto mt-2 ml-2 order-md-2"
                                    @click="createIntel()">Confirm
                            </button>
                            <button
                                    class="btn btn-darker-secondary-pareto mt-2 ml-2 ml-lg-0 order-md-1"
                                    @click="hideModal()"
                                    :disabled="!hardwareAvailable || validateTokenAmount()">Cancel
                            </button>
                        </b-row>
                    </b-container>
                </b-modal>
            </div>
        </div>
    </div>

</template>

<script>
    import DashboardService from '../services/dashboardService';
    import AuthService from '../services/authService';
    import ProfileService from '../services/profileService';
    import ContentService from '../services/ContentService';
    import {mapState, mapActions} from "vuex";

    require('summernote/dist/summernote-bs4.css');
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
                tokens: '',
                intel: {
                    state: 'empty',  // 'creating', 'created'
                    text: '',
                },
                formError: {
                    title: false,
                    body: false,
                    tokens: false
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
                placeholder: 'Content...',
                height: 400, // set editor height
                minHeight: null, // set minimum height of editor
                maxHeight: null, // set maximum height of editor
                focus: true, // set focus to editable area after initializing summernote
                link: [
                    ['link', ['linkDialogShow', 'unlink']]
                ],
                toolbar: [
                    ['style', ['bold', 'italic', 'underline', 'clear']],
                    ['fontsize', ['fontsize']],
                    ['color', ['color']],
                ],
                popover: {
                    image: [],
                    link: [],
                    air: []
                }
            });
            this.address();
        },
        methods: {
            ...mapActions(["addTransaction", "transactionComplete", "editTransaction"]),
            address: function () {
                DashboardService.getAddress(res => {
                    this.block = res.block;
                    this.blockChainAddress = res.address;
                    this.maxTokens = res.tokens;
                }, () => {

                });
            },
            createIntel: function () {
                this.hideModal();

                this.intelState('creating', 'Creating Intel, please wait');

                this.$store.state.makingRequest = true;

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
                        const intelId = res.res.intel;

                        this.$store.state.makingRequest = false;
                        this.intelState('created', 'Intel Created!');

                        this.$notify({
                            group: 'notification',
                            type: 'success',
                            duration: 10000,
                            text: 'The Intel was created'
                        });

                        this.modalWaiting = false;

                        this.redirectAfterCreateIntel(intelId);

                        //this.$router.push('/intel');
                    }, (err) => {
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
            hideModalWarning: function () {
                this.modalCloseWarning = false;
            },
            hideModal() {
                this.modalToken = false;
                if (this.signType === 'LedgerNano') {
                    AuthService.deleteWatchNano();
                    this.hardwareAvailable = false;
                }
            },
            intelState: function (state, text) {
                this.intel.state = state;
                this.intel.text = text;
            },
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
            redirectAfterCreateIntel(intelId) {
                let params = {page: 0, limit: 10};
                return DashboardService.getContent(params,
                    res => {
                        const intel = res.find(item => {
                            return intelId == item.id;
                        });

                        console.log(intel);
                        if(this.$route.path ===  '/create'){
                            this.$router.push(`intel/${intel.address}/${intel.txHash}`);
                        }
                    });
            },
            showModal() {
                this.modalToken = true;
                this.isAvailable();
            },
            showPreview() {
                this.isPreview = !this.isPreview;

                if (this.isPreview) {
                    $('.note-editor').hide();
                } else {
                    $('.note-editor').show();
                }
            },
            validateContent: function (e) {
                this.formError.tokens = this.validateTokenAmount();
                this.formError.title = !this.title;

                //The lenght is 12 because summernote, on first click, creates an empty p and br, creating 12 characters
                this.formError.body = this.body.length < 12 || !this.body;

                $('#miss-content').remove();
                if (this.formError.body) {
                    $('.note-placeholder').append('<i id="miss-content" class="fa fa-exclamation-circle shake" style="color: red"></i>')
                }

                if (this.formError.tokens || this.formError.title || this.formError.body) return;

                this.showModal();
            },
            validateTokenAmount: function () {
                return !this.tokens || parseFloat(this.tokens) <= 0 || parseFloat(this.tokens) > parseFloat(this.maxTokens);
            }
        }
    };
</script>

<style lang="scss">
    $light-blue-pareto: #1f344f;

    input:focus ~ .floating-label,
    input:not(:focus):valid ~ .floating-label {
        top: -35px;
        bottom: 10px;
        left: 5px;
        font-size: 16px;
    }

    textarea a {
        text-decoration: underline;
        color: blue;
    }

    .note-toolbar-wrapper {
        height: 30.8px !important;
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

    .bg-dark {
        background-color: transparent !important;
    }

    .create-input-space {
        position: relative;
    }

    .create-input {
        padding: 10px 0px 8px 15px;
        border-radius: 3px;
        border: 0px;
        background-color: $light-blue-pareto;
        color: white;
        width: 100%;
    }

    .create-intel-container {
        border-radius: 3px;
        border: 0px;
        background-color: $light-blue-pareto;
    }

    .create-content-text {
        font-size: 18px !important;
    }

    .modal-content {
        border: 0;
        border-radius: 2px !important;
        background: #040f1e;
        box-shadow: 0px 25px 30px 1px black;
    }

    .modal-input {
        font-size: 13px;
    }

    .note-editable {
        background: $light-blue-pareto !important;
        color: white !important;
        padding: 20px 10px !important;
        font-size: 16px !important;
    }

    .note-editor.note-frame.panel {
        padding: 10px 10px 0px;
        border: none;
    }

    .note-toolbar.panel-heading {
        padding: 0px;
        padding-left: 5px;
    }

    .note-toolbar.panel-heading a {
        color: black;
    }

    .note-editing-area {
        margin-top: 2px;
    }

    .note-placeholder {
        color: white;
        font-size: 16px;
        padding-top: 20px !important;
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

    #preview {
        border-radius: 3px;
        height: 442px;
        min-height: 300px;
        overflow: auto;
        width: 100%;
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
        font-weight: bolder;
        padding-left: 10px;
    }
</style>
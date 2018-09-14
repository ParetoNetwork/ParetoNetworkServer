<template>
    <div class="pareto-bg-dark">
        <notifications group="auth" position="bottom right"/>
        <div class="container main  wrapp pb-5"
             style="min-height: 100vh;">
            <div class="row mt-5 p-1 text-left">
                <div class="col-md-5 font-body">
                    <div class="flex-row">
                        <form id="intel"
                              style="margin: 5px;"
                              v-on:submit.prevent
                              @submit="validateContent">
                            <div class="group">
                                <label class="pareto-label"><b>Authorized Contributor</b></label>
                                <input class="lookup-input"
                                       type="text"
                                       name="address" readonly v-model="blockChainAddress">
                                <span class="highlight"></span>
                                <span class="bar"></span>
                            </div>

                            <div class="group my-4">
                                <label class="pareto-label"><b>Title</b> <span style="color: red">*</span> </label>
                                <input id="intel-title-input"
                                       type="text" class="lookup-input"
                                       name="intel-title" v-model="title">
                                <span class="highlight"></span>
                                <span class="bar"></span>
                                <label v-if="formError.title === false" class="pareto-label" style="color: red"> Required Field </label>
                            </div>

                            <textarea id="intel-body-input"
                                      name="editordata"
                                      v-model="body"
                            ></textarea>
                            <label v-if="formError.body === false" class="pareto-label" style="color: red"> Required Field </label>

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
                        </form>
                    </div>
                </div>

                <div class="col-md-6 font-body text-left"
                     style="color: #fff; min-height: 80vh;">
                    <label class="pareto-label"><b>Intel Content Preview</b></label>

                    <div id="preview"
                         style="padding: 5px; color: #000; background-color: rgba(161, 161, 161, 1); width: 100%; height: 95%; min-height: 400px; border: 1px solid #a9a9a9; border-radius: 5px;">
                        <p v-html="body"> </p>
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
                        <p class="text-dashboard mb-2" style="font-size: 16px">  You need to deposit Pareto tokens to create Intel. Please input the amount to deposit</p>

                        <b-form-input v-model="tokens"
                                      type="number"></b-form-input>
                        <b-row class="m-2 mt-4 d-flex justify-content-center">
                            <b-button class="mr-2" variant="danger" @click="hideModal()"> Cancel </b-button>
                            <b-button style="background-color: rgb(107, 194, 123)" :disabled="tokens<=0 || tokens > maxTokens" variant="success" @click="upload()"> Confirm </b-button>
                        </b-row>
                    </b-container>
                </b-modal>
            </div>
            <div>
                <b-modal
                        no-close-on-backdrop
                        v-model="modalWaiting"
                        centered
                        hide-header
                        hide-footer
                        @hide="hideModal"
                        :body-bg-variant="'dark'"
                        :body-text-variant="'light'">

                    <b-container fluid>
                        <h3 class="font-body mb-4">Creating an Intel has a two step confirmation </h3>
                        <div >
                            <div class="m-2 ml-4">

                                <ol class="text-left">
                                    <li>MetaMask will ask you to confirm the amount of Pareto that you'd like to deposit</li>
                                    <li>MetaMask will prompt you to create the intel on the Ethereum Blockchain</li>
                                </ol>
                                <p class="text-center mt-4" style="text-align: justify !important; text-justify: inter-word;">
                                    This operation may take a while as we communicate with the Ethereum Blockchain.
                                    Please do not close your browser or navigate to a different page.
                                    Upon successful creation of Intel, Pareto will take you back to your Feed. </p>
                                <i class="fa fa-spinner fa-spin fa-3x mt-4" ></i></div>
                                <p class="text-center mt-4" style="font-size: 11px">
                                    If MetaMask does not popup, please check your MetaMask extension icon for a new badge that signifies an operation should be taken on MetaMask
                                    <img src="../assets/images/mmicon.png" alt="" class="icon-mini pl-2">
                                </p>
                        </div>
                    </b-container>
                </b-modal>
            </div>
        </div>
    </div>

</template>

<script>
    import DashboardService from '../services/dashboardService';
    import ContentService from '../services/ContentService';
    require('summernote/dist/summernote.css');
    require('summernote');

    export default {
        name: 'VCreateIntel',
        data: function () {
            return {
                logged: false,
                block: null,
                body : '',
                content : '',
                title:'',
                maxTokens: 1,
                blockChainAddress:'',
                tokens: 1,
                intel :{
                    state: 'empty',
                    text : '',
                },
                formError: {
                    title :'',
                    body : ''
                },
                modalToken : false,
                modalWaiting : false,
                notificationSystem: {
                    options: {
                        success: {
                            position: 'bottomCenter'
                        },
                        info: {
                            overlay: true,
                            timeout: 50000,
                            position: 'bottomRight'
                        },
                        error: {
                            timeout: 20000,
                            position: 'bottomRight'
                        }
                    }
                }
            };
        },
        updated: function() {
            this.$nextTick(function () {
                let edit = $('.note-editable')[0];
                if(edit){
                    $(edit).keyup(() => {
                        this.body = edit.innerHTML;
                    });
                }
            });
        },
        computed : {
            bodyFunction: function () {
                return content;
            }
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
        },
        methods: {
            address: function () {
                DashboardService.getAddress(res => {
                    this.block = res.block;
                    this.blockChainAddress = res.address
                    this.maxTokens = res.tokens
                }, () => {

                });
            },
            validateContent: function(e){

                this.formError.title = !!this.title;
                this.formError.body = this.body.length>3;

                if(!this.formError.title || !this.formError.body) return;

                this.showModal();

            },
            upload: function () {
                this.hideModal();
                //console.log(this.tokens);

                this.intelState('creating', 'Creating Intel, please wait');
                //console.log({block:this.block, title: this.title, body: this.body.innerHTML, address: this.blockChainAddress});

                this.$store.state.makingRequest = true;
                this.modalWaiting = true;

                ContentService.createIntel({block:this.block, title: this.title, body: this.body, address: this.blockChainAddress}, this.tokens, (res) => {

                    this.$store.state.makingRequest = false;
                    this.intelState('created', 'Intel Created!');

                    this.$notify({
                        group: 'foo',
                        type: 'success',
                        duration: 10000,
                        text: 'The Intel was created' });

                    this.modalWaiting = false;

                    this.$router.push('/intel');
                }, (err) => {
                    this.intelState('empty', '');

                    this.modalWaiting = false;
                        if (typeof err === 'string')
                            err='Could not create Intel. ' +  err.split('\n')[0];
                    this.$notify({
                        group: 'foo',
                        type: 'error',
                        duration: 20000,
                        text: err || 'Could not create Intel' });
                    this.$store.state.makingRequest = false;
                })
                
            },
            intelState : function (state, text) {
                this.intel.state = state;
                this.intel.text = text;
            },
            showModal () {
                this.modalToken = true;
            },
            hideModal () {
                this.modalToken = false;
            }
        }

    };
</script>

<style>
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
</style>
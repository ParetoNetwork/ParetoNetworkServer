<template>
    <div class="pareto-bg-dark">
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
                                      name="editordata" v-model="body"></textarea>
                            <label v-if="formError.body === false" class="pareto-label" style="color: red"> Required Field </label>

                            <div class="d-flex justify-content-center">
                                <input v-if="intel.state ==='empty'"
                                        class="button bg-white pareto-text-blue mt-2"
                                        style="width:100px; height: 35px; line-height: 32px;"
                                        type="submit"
                                        form="intel"
                                        value="Submit">
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
                        {{body.innerText}}
                    </div>

                </div>
            </div>
        </div>
    </div>

</template>

<script>
    import DashboardService from '../services/dashboardService';
    import ContentService from '../services/ContentService';

    export default {
        name: 'VCreateIntel',
        data: function () {
            return {
                logged: false,
                block: null,
                body:'',
                title:'',
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
                },
                question: {
                    timeout: 200000,
                    overlay: true,
                    displayMode: 'once',
                    id: 'inputs',
                    zindex: 999,
                    title: 'Inputs',
                    message: 'Examples',
                    position: 'center',
                    drag: false,
                    inputs: [
                        ['<input type="number" value="1">', 'keyup', (instance, toast, input, e) => {
                            this.tokens = input.value;
                        }]
                    ],
                    buttons: [
                        ['<button><b>Create</b></button>',  (instance, toast) => {
                            instance.hide({ transitionOut: 'fadeOut' }, toast, 'button');
                            this.upload();
                        }, true],
                        ['<button>Cancel</button>', (instance, toast) => {
                            instance.hide({ transitionOut: 'fadeOut' }, toast, 'button');
                            this.$toast.error('The Pareto transaction was cancelled', 'Cancelled', this.notificationSystem.options.error);
                        }]
                    ],
                    onClosed: function(instance, toast, closedBy){
                        console.info('Closed | closedBy: ' + closedBy);
                    }
                }

            };
        },
        mounted: function () {
            $('#intel-body-input').summernote({
                height: 300, // set editor height
                minHeight: null, // set minimum height of editor
                maxHeight: null, // set maximum height of editor
                focus: true, // set focus to editable area after initializing summernote
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
                }, () => {

                });
            },
            validateContent: function(e){
                this.body = $('.note-editable')[0];

                this.formError.title = !!this.title;
                this.formError.body = this.body.innerText.length>3;

                if(!this.formError.title || !this.formError.body) return;

                this.$toast.question('Tokens to deposit for creating Intel', 'Pareto', this.question);
            },
            upload: function () {

                this.intelState('creating', 'Creating Intel, please wait');
                console.log({block:this.block, title: this.title, body: this.body.innerHTML, address: this.blockChainAddress});

                ContentService.uploadContent({block:this.block, title: this.title, body: this.body.innerHTML, address: this.blockChainAddress}, res => {
                    this.$store.state.makingRequest = true;
                    this.$toast.info('Please wait for both confirm dialogs', 'Loading', this.notificationSystem.options.info)

                    ContentService.createIntel({ID:res.content.Intel_ID}, this.tokens, (res) => {
                        console.log(res);
                        this.$store.state.makingRequest = false;
                        this.intelState('created', 'Intel Created!');
                        this.$toast.success('The Intel was created', 'New Pareto', this.notificationSystem.options.success);
                        this.$router.push('/intel');
                    }, (err) => {
                        console.log(err);
                        this.$toast.destroy()
                        this.intelState('empty', '');
                        this.$toast.error('Error, could not create Intel', 'Cancelled', this.notificationSystem.options.error);
                        this.$store.state.makingRequest = false;
                    })
                }, error => {

                });
            },
            intelState : function (state, text) {
                this.intel.state = state;
                this.intel.text = text;
            }
        }

    };
</script>

<style scoped lang="scss">
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
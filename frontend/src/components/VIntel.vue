<template>
    <div class="pareto-bg-dark">
        <div class="container main  wrapp"
             style="min-height: 100vh;">
            <div class="row">
                <div class="col-md-4 font-body"
                     style="color: #040f1e; margin-top: 30px; padding-top: 20px; text-align: left;">

                    <div class="flex-row">
                        <!-- hidden by default unless metamask connect -->
                        <form id="intel"
                              style="margin: 5px;">
                            <div class="group">
                                <label class="pareto-label">Authorized Contributor</label>

                                <input id="lookup-input"
                                       type="text"
                                       name="address">
                                <span class="highlight"></span>
                                <span class="bar"></span>
                            </div>
                            <p>&nbsp;</p>

                            <div class="group">
                                <label class="pareto-label">Title</label>

                                <input id="intel-title-input"
                                       type="text"
                                       name="intel-title" v-model="title">
                                <span class="highlight"></span>
                                <span class="bar"></span>
                            </div>
                            <p>&nbsp;</p>

                            <!-- intel-body-input -->
                            <textarea id="intel-body-input"
                                      name="editordata" v-model="body"></textarea>

                        </form>
                    </div>
                    <div class="d-flex justify-content-center">
                        <button
                                class="button bg-white pareto-text-blue"
                                style="width:100px; height: 35px; line-height: 32px;"
                                type="button"
                                form="intel"
                                value="View"
                                v-on:click="upload()"
                        >Submit
                        </button>
                    </div>


                </div>
                <!-- end post new intel section -->

                <div class="col-md-6 font-body text-left"
                     style="color: #fff; min-height: 80vh;">
                    <b>Intel Content Preview</b>

                    <div id="preview"
                         style="padding: 5px; color: #000; background-color: rgba(161, 161, 161, 1); width: 100%; height: 100%; border: 1px solid #a9a9a9; border-radius: 5px;">
                        {{body}}
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
        name: 'VIntel',
        data: function () {
            return {
                logged: false,
                block: null,
                body:'',
                title:''
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
                ]
            });
            this.address();
        }, methods: {
            address: function () {
                DashboardService.getAddress(res => {
                    this.block = res.block;
                }, () => {

                });
            },
            upload: function () {
                const x = document.getElementById('intel-body-input').value

                ContentService.uploadContent({block:this.block, title: this.title, body: x},res => {
                    this.body = x.slice(3,x.length -4);
                }, error => {

                });
            }
        }

    };
</script>

<style scoped lang="scss">
    .popover {
        background-color: #6bc27a;
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

    .pareto-label {
        color: #ffffff;
        font-size: 18px;
        font-weight: normal;
        pointer-events: none;
        transition: 0.2s ease all;
        -moz-transition: 0.2s ease all;
        -webkit-transition: 0.2s ease all;
    }
</style>
<template>
    <div class="">
        <div class="container main  wrapp"
             style="min-height: 100vh;">
            <div class="row">
                <div class="col-md-4 font-body center-page"
                     style="color: #040f1e; margin-top: 30px; padding-top: 20px; text-align: left;">

                    <div class="flex-row">
                        <!-- hidden by default unless metamask connect -->
                        <form id="intel"
                              style="margin: 5px;">
                            <div class="group">
                                <input id="lookup-input"
                                       type="text"
                                       name="address">
                                <span class="highlight"></span>
                                <span class="bar"></span>
                                <label class="pareto-label">Authorized Contributor</label>
                            </div>
                            <p>&nbsp;</p>

                            <div class="group">
                                <input id="intel-title-input"
                                       type="text"
                                       name="intel-title">
                                <span class="highlight"></span>
                                <span class="bar"></span>
                                <label class="pareto-label">Title</label>
                            </div>
                            <p>&nbsp;</p>

                            <!-- intel-body-input -->
                            <textarea id="intel-body-input"
                                      name="editordata"></textarea>

                        </form>
                    </div>

                    <button id="intel-body-button"
                            class="button"
                            style="margin:5px; width:100px; height: 35px;"
                            type="button"
                            form="intel"
                            value="View"
                    >Submit
                    </button>

                </div>
                <!-- end post new intel section -->

                <div class="col-md-6 font-body"
                     style="color: #fff; min-height: 80vh;">
                    <b>Intel Content Preview</b>

                    <div id="preview"
                         style="padding: 5px; color: #000; background-color: rgba(161, 161, 161, 1); width: 100%; height: 100%; border: 1px solid #a9a9a9; border-radius: 5px;"></div>

                </div>
            </div>
        </div>
    </div>

</template>

<script>
    import AuthService from '../services/authService';

    export default {
        name: 'VIntel',
        data: function () {
            return {
                logged: false
            };
        },
        mounted: function () {
            $('#intel-body-input').summernote({
                height: 300, // set editor height
                minHeight: null, // set minimum height of editor
                maxHeight: null, // set maximum height of editor
                focus: true, // set focus to editable area after initializing summernote
                toolbar: [
                    ['font', ['bold', 'italic', 'underline' /*, 'clear'*/ ]],
                    // ['font', ['bold', 'italic', 'underline', 'strikethrough', 'superscript', 'subscript', 'clear']],
                    //['color', ['color']],
                    ['para', [ /*'ul', 'ol', */ 'paragraph']],
                    //['height', ['height']],
                    //['table', ['table']],
                    ['insert', ['link', /*'picture',*/ ]],
                    //['view', ['fullscreen' /*, 'codeview'*/]],
                    //['help', ['help']]
                ]
            });
        }, methods: {
            auth: function () {
                AuthService.auth(() => {
                    this.logged = true;
                }, () => {
                    this.logged = false;
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
</style>
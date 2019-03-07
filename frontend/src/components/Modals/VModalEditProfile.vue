<template>
    <b-modal
            centered
            hide-header
            hide-footer
            ref="myModalRef"
            title="Edit Profile"
            @hide="onClosedModal">
        <div class="d-block text-center pt-5">
            <form action="">
                <div class="input-group mb-3 create-input-space">
                    <input v-model="alias" type="text" class="create-input create-content-text text-user-content" id="alias"
                           aria-describedby="basic-addon3" required>
                    <span class="floating-label create-content-text title-user-content">
                        <b> Alias </b>
                    </span>
                </div>
                <div class="input-group mb-3 create-input-space">
                    <b class="pareto-subtitle create-content-text title-user-content ml-3 mb-2">
                        Current Alias Slug
                    </b>
                    <input v-model="aliasSlug || user.aliasSlug" type="text" class="readonly-input create-content-text text-user-content" id="alias-slug"
                           aria-describedby="basic-addon3" onkeydown="event.preventDefault()" readonly>
                </div>
                <div class="input-group mb-3 mt-5 create-input-space">
                    <textarea v-model="bio" class="create-input create-content-text text-user-content" id="bio" rows="4"
                              aria-describedby="basic-addon3" required> </textarea>
                    <span class="floating-label create-content-text title-user-content">
                        <b> Biography </b>
                    </span>
                </div>
            </form>
            <b-row class="m-2 mt-4 d-flex justify-content-end">
                <button
                        class="btn btn-dark-primary-pareto mt-2 ml-2 order-md-2" @click="updateProfile()"> Update
                </button>
                <button
                        class="btn btn-darker-secondary-pareto mt-2 ml-2 ml-lg-0 order-md-1"
                        @click="$refs.myModalRef.hide(); alias = user.alias; bio = user.biography">Cancel
                </button>
            </b-row>
        </div>
    </b-modal>
</template>
<script>
    import { mapMutations} from 'vuex';
    import {utilities} from "../../mixins/utilities";
    import profileService from "../../services/profileService";

    export default {
        name: 'VModalEditProfile',
        mixins: [utilities],
        props : [
          'user'
        ],
        data : function(){
            return {
                alias : '',
                bio: '',
                aliasSlug: '',
            }
        },
        watch : {
            'alias' : function (newAlias) {
                this.aliasSlug = this.slugify(newAlias);
            }
        },
        mounted() {
            this.$refs.myModalRef.show();
            this.alias = this.user.alias;
            this.bio = this.user.biography;
            this.alias = this.user.alias;
        },
        methods: {
            ...mapMutations(["openModalEditProfile"]),
            onClosedModal(){
                this.alias = this.user.alias;
                this.bio = this.user.biography;
                this.alias = this.user.alias;
                this.openModalEditProfile(false);
            },
            updateProfile() {
                const profile = {
                    alias: this.alias,
                    biography: this.bio
                };
                profileService.updateProfile(
                    profile,
                    res => {
                        this.$emit('profileEdit', res.data);

                        this.onClosedModal();
                        this.$notify({
                            group: 'notification',
                            type: 'success',
                            duration: 10000,
                            title: 'Login',
                            text: 'Profile Updated Successfully!'
                        });
                    },
                    error => {
                        let errorText = error.message ? error.message : error;
                        this.$notify({
                            group: 'notification',
                            type: 'error',
                            duration: 10000,
                            title: 'Login',
                            text: errorText
                        });
                    }
                );
            },
        }
    }
</script>
<style>

</style>
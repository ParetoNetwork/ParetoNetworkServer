<template>
    <div class="container main  wrapp">
        <div class="row pt-5">
            <div class="col-md-5">

                <template v-if="address">
                    <div class="media py-1 px-4 border mb-5 align-items-center">
                        <div class="d-flex flex-column">
                            <div class="border p-2 mb-2 mr-2" >
                                <span style="font-size: 50px;  color: gray; background: #b2b2b2" class="fa fa-user p-2"></span>

                            </div>
                            <!--
                            <button class="btn btn-primary">
                                EDIT PROFILE
                            </button>
                            -->
                        </div>


                        <div class="media-body flex-column text-left">
                            <span>{{address.address.slice(0,20) + "..."}}</span>

                            <div class="">
                                <img src="../assets/images/LogoMarkColor.svg" width="20px" alt="">
                                <span class="text"><b>{{address.tokens + "PARETO"}}</b></span>
                                <div class="pl-2">

                                </div>
                            </div>
                            <span>{{'Network Rank ' + address.rank}}</span>
                        </div>
                    </div>
                </template>

                <table class="table border">
                    <thead>
                    <th>MY POSTS</th>
                    </thead>
                    <tbody class="p-3">

                    <template v-if="!myContent.length">
                        <tr>
                            <td>
                                <span>No data to display</span>
                            </td>
                        </tr>
                    </template>
                    <tr :key="row._id" v-for="row of myContent">
                        <td class="text-left">
                            <b> {{row.title }}</b><br/>
                            <div style="font-size: 12px;">Disclosed by: {{row.address }} <span v-if="row.alias">({{row.alias}})</span>
                                at block
                                {{row.block}}
                            </div>
                            <br/>
                            <div class="" v-html="row.body"></div>
                        </td>
                    </tr>
                    </tbody>
                </table>

            </div>
            <div class="col-md-7">
                <div class="border">
                    <span></span>
                    <table class="table table-responsive">
                        <thead>
                        <tr>
                            <th>MY INTEL FEED</th>
                        </tr>
                        </thead>
                        <tbody >
                        <template v-if="loading">
                            <tr>
                                <td>
                                    <span>Loading...</span>
                                </td>
                            </tr>
                        </template>
                        <tr  :key="row._id" v-for="row of content">
                            <td class="text-left p-3">
                                <b> {{row.title }}</b><br/>
                                <div style="font-size: 12px;">Disclosed by: {{row.address}} <span v-if="row.alias">({{row.alias}})</span>
                                    at block
                                    {{row.block}}
                                </div>
                                <br/>
                                <div v-html="row.body"></div>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import dashboardService from '../services/dashboardService';

    export default {
        name: 'VDashboard',
        data: function () {
            return {
                address: null,
                content: [],
                myContent: [],
                loading: true
        }
            ;
        },
        mounted: function () {
            this.loadAddress();
            this.loadContent();
        },
        methods: {
            loadAddress: function () {
                dashboardService.getAddress(res => {
                    this.address = res;

                }, () => {
                    // alert(error);
                });
            }, loadContent: function () {
                dashboardService.getAllContent(res => {
                    this.loading = false;
                    this.content = res;
                }, error => {
                    alert(error);
                });
            }, loadMyContent: function () {
                dashboardService.getContent(res => {
                    this.myContent = res;
                }, error => {
                    alert(error);
                });
            }
        }
    };
</script>

<style scoped>
    .wrapp {
        color: black;
        font-size: 12px;
    }
</style>
<template>
    <div class="container  wrapp">
        <div class="row ">
            <div class="col-md-4">

                <template v-if="address">
                    <div class="media border mb-5">
                        <img src="" alt="">
                        <div class="media-body ">

                            <span style="font-size: 12px;" class="pareto-truncate-text">{{address.address}}</span>
                            <span>{{'&nbsp;' + address.tokens + '&nbsp;PARETO'}}</span>
                            <span>{{'Network Rank ' + address.rank}}</span>
                        </div>
                    </div>
                </template>

                <table class="table border">
                    <thead>
                    <th>MY POSTS</th>
                    </thead>
                    <tbody>
                    <template v-if="!myContent.length">
                        <tr>
                            <td>
                                <span>No data to display</span>
                            </td>
                        </tr>
                    </template>
                    <tr :key="row._id" v-for="row of myContent">
                        <td>
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
            <div class="col-md-8">
                <div class="border">
                    <span></span>
                    <table class="table table-responsive">
                        <thead>
                        <tr>
                            <th>MY INTEL FEED</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr :key="row._id" v-for="row of content">
                            <td>
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
                myContent: []
            };
        },
        mounted: function () {
            this.loadAddress();
            this.loadContent();
        },
        methods: {
            loadAddress: function () {
                dashboardService.getAddress(res => {
                    this.address = res;
                }, error => {
                    alert(error);
                });
            }, loadContent: function () {
                dashboardService.getAllContent(res => {
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
<template>
    <div class="main wrapp pareto-blue-dark">
        <div class="container position-relative px-lg-5 pb-60">
            <h1>Pareto Network Weekly reports</h1>
            <div class="row">
                <div class="col-md-12">
                    <div class="small">
                        <line-chart :chart-data="datacollection" :options="options"></line-chart>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-md-6">


                    <ul>
                        <li>Commits in total:  {{commits_data.length}} </li>
                        <li>Telegram chat:  210 </li>
                        <li>Number of contributors:  5 </li>



                    </ul>
                </div>
                <div class="col-md-6">
                    <ul>

                        <li>Trasaccions:  {{transactions}}</li>
                        <li>Pull request:  48 </li>
                        <li>Telegram total::  32 </li>
                        <li>Telegram announcements:  310 </li>

                    </ul>

                </div>
            </div>

        </div>
    </div>
</template>

<script>

    import ReportService from '../services/ReportService'
    import LineChart from '../utils/charts/LineChart'


    export default {
        name: 'VReportWeekly',
        created: function () {

            ReportService.reportWeekly(
                res => {

                    this.commits_data =  res.data.commits;
                    this.transactions =  res.data.transactions;
                    this.fillData();
                },
                error => {
                    console.log(error);
                }
            )


        },
        components: {
            LineChart
        },
        data: function () {
            return {
                commits_data: [],
                transactions: [],
                datacollection: null,
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            };
        },
        computed: {

        },
        methods: {

            fillData () {

                let commits = this.commits_data;
                let days_commits = [];
                let counts_commits = [];
                for (var i = 0 ;  i < commits.length; i++) {
                    counts_commits.push(commits[i].count);
                    days_commits.push(commits[i]._id.day);
                }

                this.datacollection = {
                    labels: days_commits,
                    datasets: [
                        {
                            label:  'Commits',
                            backgroundColor: '#4df835',
                            data: counts_commits
                        }
                    ]
                }
            },

        }
    };
</script>

<style scoped lang="scss">
    .pb-60{
        padding-bottom: 60px;
    }
    ul{
        list-style: none;
    }
    .small {
        max-width: 600px;
        margin:  50px auto;
    }
</style>

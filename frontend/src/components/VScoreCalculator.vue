<template>
    <div class="main wrapp">
        <div class="container pt-5">
            <h1> Calculator </h1>
            <form>
                <div class="form-group">
                    <label for="formGroupExampleInput">Example label</label>
                    <input type="text" class="form-control" id="formGroupExampleInput" placeholder="Example input">
                </div>
                <div class="form-group">
                    <label for="formGroupExampleInput2">Another label</label>
                    <input type="text" class="form-control" id="formGroupExampleInput2" placeholder="Another input">
                </div>
            </form>
        </div>
    </div>
</template>
<script>
    export default {
        name: 'VScoreCalculator',
        components: {},
        data : function () {
            return {
                component : 'score'
            };
        },
        mounted: function () {
            console.log(this.component)
        }
    }
</script>
<style>
    .wrapp {
        color: black;
        font-size: 14px;
    }
</style>
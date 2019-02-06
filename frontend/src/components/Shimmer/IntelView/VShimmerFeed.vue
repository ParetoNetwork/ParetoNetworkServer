<template>
    <div class="border p-2">
        <div class="p-3">
            <div class="dark-shine border thick-medium-lines m-auto"></div>
        </div>
        <div>
            <ul class="list-unstyled list-group">
                <li v-for="n in 10" class="border-0 px-1 py-2">
                    <div class="row">
                        <div class="col-lg-9">
                            <div class="row">
                                <div class="col-2">
                                    <div class="dark-shine border box" style="width: 50px; height: 50px; border-radius: 50%"></div>
                                </div>
                                <div class="col-10 pl-4 pl-lg-1 pr-4">
                                    <div class="dark-shine border thick-lines"></div>
                                    <div class="dark-shine border medium-lines"></div>
                                    <div class="dark-shine border medium-lines"></div>
                                </div>
                            </div>
                        </div>
                        <div class="col-lg-2 pt-2 px-0">
                            <div class="dark-shine border thick-lines mx-auto" style="max-width: 120px"></div>
                        </div>
                    </div>
                </li>
            </ul>
        </div>
    </div>
</template>

<script>
    export default {
        name: "VShimmerFeed"
    }
</script>

<style scoped>

</style>
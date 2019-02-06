<template>
    <div class="p-4">
        <div class="dark-shine border thick-medium-lines mt-4"></div>
        <ul class="list-unstyled list-group mt-2">
            <li v-for="n in 5" class="border-0 mt-4">
                <div class="pb-1">
                    <div class="d-flex justify-content-between">
                        <div class="w-100">
                            <div class="dark-shine border thick-lines"></div>
                            <div class="dark-shine border medium-lines"></div>
                        </div>
                        <div class="dark-shine border medium-lines ml-3"></div>
                    </div>
                </div>
            </li>
        </ul>
    </div>
</template>

<script>
    export default {
        name: "VShimmerMyPost"
    }
</script>

<style scoped>

</style>
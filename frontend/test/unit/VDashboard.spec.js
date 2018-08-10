import Vuex from 'vuex'
import { expect } from 'chai'
import {mount, shallowMount, createLocalVue } from '@vue/test-utils'
import VIntel from '@/components/VIntel.vue'
import App from '@/App.vue'

const localVue = createLocalVue()
localVue.use(Vuex)

describe('App.vue', () => {
    it('renders Dashboard', () => {
        const wrapper = shallowMount(VIntel );
        expect(wrapper.html()).contain('MY INTEL FEED');
    });
    //
    // it('Opens IntelDetail', () => {})
});

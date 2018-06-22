import Vuex from 'vuex'
import { expect } from 'chai'
import {mount, shallowMount, createLocalVue } from '@vue/test-utils'
import VLeaderboards from '@/components/VLeaderboards.vue'
import App from '@/App.vue'

const localVue = createLocalVue()
localVue.use(Vuex)

describe('App.vue', () => {
    it('render Leaderboards', () => {

        const wrapper = shallowMount(VLeaderboards );
        expect(wrapper.html()).contain('Wallet Address');
    })
});

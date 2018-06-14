import Vuex from 'vuex'
import { expect } from 'chai'
import {mount, shallowMount, createLocalVue } from '@vue/test-utils'
import VParticles from '@/components/VParticles.vue'
import App from '@/App.vue'

const localVue = createLocalVue()
localVue.use(Vuex)

describe('App.vue', () => {
    it('render Particles view', () => {
        const wrapper = shallowMount(VParticles, {
        } );
        expect(wrapper.html()).contain('Pareto Network');
    })
});

import Vuex from 'vuex'
import { expect } from 'chai'
import {mount, shallowMount, createLocalVue } from '@vue/test-utils'
import Navbar from '@/components/Navbar.vue'
import App from '@/App.vue'

const localVue = createLocalVue()
localVue.use(Vuex)

describe('App.vue', () => {
  it('renders Navbar click', () => {

    const wrapper = shallowMount(Navbar, {
        mocks: {
            $store: {
                state: {
                    isLogged: false
                }
            }
        },
        localVue
    });
    const button = wrapper.find('#navbarDropdown');
    console.log("HOLA")
    button.trigger('click');
    expect(wrapper.html()).contain('No user AUTHENTICATED');
  })
});

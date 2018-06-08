import Vuex from 'vuex'
import { expect } from 'chai'
import {mount, shallowMount, createLocalVue } from '@vue/test-utils'
import Navbar from '@/components/Navbar.vue'
import App from '@/App.vue'

const localVue = createLocalVue();
localVue.use(Vuex);



describe('App.vue', () => {

    it('Test Nabvar types', () => {
        expect(typeof Navbar.data).equals('function');
        expect(typeof Navbar.methods).equals('object');
        expect(typeof Navbar.methods.login).equals('function');
        expect(typeof Navbar.methods.logout).equals('function');

    });

    it('renders Navbar, and  click in menu', () => {
        const wrapper =  shallowMount(Navbar, {
            mocks: {
                $store: {
                    state:  {
                        isLogged: false
                    }
                }
            },
            localVue
        });
        const button = wrapper.find('#navbarDropdown');
        button.trigger('click');
        expect(wrapper.html()).contain('No user AUTHENTICATED');
    });

    it('Test Navbar states', () => {

        const unsignWrapper =  shallowMount(Navbar, {
            mocks: {
                $store: {
                    state:  {
                        isLogged: false
                    }
                }
            },
            localVue
        });
        const undisbutton = unsignWrapper.find('#navbarDropdown');
        undisbutton.trigger('click');
        expect(unsignWrapper.html()).contain('No user AUTHENTICATED');
        expect(unsignWrapper.html()).contain('Sign In');
        const address = '0xcceba3addf4504d227c4f57aeb8c329c2e88c080';
        const wrapper =  shallowMount(Navbar, {
            mocks: {
                $store: {
                    state:  {
                        isLogged: true,
                        address: address
                    }
                }
            },
            localVue
        });
        const button = wrapper.find('#navbarDropdown');
        button.trigger('click');
        expect(wrapper.html()).contain(address);
        expect(wrapper.html()).contain('Logout');


    })
});

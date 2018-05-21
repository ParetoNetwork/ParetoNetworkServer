import { expect } from 'chai'
import { shallowMount } from '@vue/test-utils'
import Navbar from '@/components/Navbar.vue'

describe('Navbar.vue', () => {
  it('renders Navbar click', () => {
    const msg = 'new message';
    const wrapper = shallowMount(Navbar);
    expect(wrapper.text()).to.include(msg)
  })
});

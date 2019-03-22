import ContentService from './ContentService';

export default class PurchaseService {

  static async generateAddress() {
    let pk = localStorage.getItem("privateKey");

    if (!pk) {
      const {web3} = await ContentService.Setup({});
      const userInfo = web3.eth.accounts.create();
      localStorage.setItem("privateKey", btoa(userInfo.privateKey));
    }
  }
}
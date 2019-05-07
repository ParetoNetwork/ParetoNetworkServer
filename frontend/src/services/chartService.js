import http from './HttpService';
import environment from '../utils/environment';
import Identicon from 'identicon.js';
import errorService from "./errorService";

export default class chartService {

  static getStackedGroupedInformation(onSuccess, onError) {
    const cachedChartInformation = this.getStackedGroupedInformation.chartInfo;

    if (cachedChartInformation) {
      return onSuccess(cachedChartInformation);
    } else {
      return http.get('/v1/stacked-grouped-information').then(res => {
        if (res.data.success) {
          this.getStackedGroupedInformation.chartInfo = res.data.data;
          onSuccess(res.data.data);
        } else {
          onError(res.data.error);
        }
      });
    }
  }
};
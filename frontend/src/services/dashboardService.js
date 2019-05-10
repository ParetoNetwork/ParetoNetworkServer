import http from './HttpService';
import errorService from "./errorService";

export default class dashboardService {

  static getAddress(onSuccess, onError, logginUnnecessary) {
    if (this.getAddress.address) {
      return onSuccess(this.getAddress.address);
    } else {
      return http.get('/v1/address', {
        withCredentials: true
      }).then(res => {
        let response = res.data;
        this.getAddress.address = response.data;

        if (response.success) {
          return onSuccess(response.data);
        } else if (logginUnnecessary) {
          return onError('');
        } else {
          return onError(errorService.sendErrorMessage('f24', response.message));
        }
      }).catch(error => {
        if (logginUnnecessary) {
          return onError('');
        } else {
          return onError(errorService.sendErrorMessage('f24', error));
        }
      });
    }
  }

  static getIntel(intel, onSuccess, onError) {
    return http.get('/v1/intel/' + intel).then(res => {
      if (res.data.success) {
        return onSuccess(res.data.data);
      } else {
        return onError(errorService.sendErrorMessage('f25', res.data.message));
      }
    }).catch(error => {
      return onError(errorService.sendErrorMessage('f25', error));
    });
  }

  static getIntel(params, onSuccess, onError) {
    return http.get('/v1/intel/me?compact=true', {params}).then(res => {
      if (res.data.success) {
        return onSuccess(res.data.data);
      } else {
        return onError(errorService.sendErrorMessage('f26', res.data.message));
      }
    }).catch(error => {
      return onError(errorService.sendErrorMessage('f26', error));
    });
  }

  static getAllIntel(params, onSuccess, onError) {
    const {limit, page} = params || {limit: 20, page: 0};
    let query_params = window.location.search.split('?');
    let total_query = "";

    if (query_params.length > 0) {
      total_query = "&" + query_params[1];
    }

    return http.get('/v1/intel?compact=true&limit=' + limit + '&page=' + page + total_query).then(res => {
      //console.log(res);
      if (res.data.success) {
        return onSuccess(res.data.data);
      } else {
        return onError(errorService.sendErrorMessage('f27', res.data.message));
      }
    }).catch(error => {
        console.log(error);
      return onError(errorService.sendErrorMessage('f27', error));
    });
  }
}
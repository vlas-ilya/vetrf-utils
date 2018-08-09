import { properties } from './properties';

const isJSONResponse = (response) => {
   return response.headers && response.headers.get('content-type') && response.headers.get('content-type').match(/application\/json/);
};

export function ajax(params) {
   return new Promise((resolve, reject) => {
      fetch(properties.baseUrlRest + (params.url || ''), {
         method:        params.type || 'POST',
         body:          params.uploadFile ? params.data : JSON.stringify(params.data),
         headers:       params.uploadFile ? undefined : { 'Content-Type': 'application/json; charset=utf-8' },
         credentials:   params.credentials || 'same-origin',
         timeout:       params.timeout || 300000
      }).then(function (response) {
         if (response.url && response.url.indexOf("login.html") !== -1) {
            return Promise.reject({ status: 401, ajax: () => new Promise((r, _) => r({ })) });
         } else if (response.status === 200) {
            return response;
         } else {
            return Promise.reject(response);
         }
      }).then(function (response) {
         if (isJSONResponse(response)) {
            return response.json();
         } else {
            return response;
         }
      }).then(function (result) {
         resolve(result);
      }).catch(function (error) {
         console.log(error);
         if (params.sessionErrorHandler && error.status === 401) {
            params.sessionErrorHandler(error);
         } else if (error.json) {
            error.json().then(json => reject({ ...json, status: error.status })).catch(() => reject({ status: 500 }));
         } else {
            reject({ status: error.status || 404 })
         }
      });
   });
}

export class Ajax {
   constructor(url) {
      this.url = url;
      this._type = 'POST';
   }

   clear = () => {
      this._clear = true;
   };

   post = (data) => {
      this._type = 'POST';
      this._data = data;
      return this;
   };

   get = (data) => {
      this._type = 'GET';
      this._data = data;
      return this;
   };

   put = (data) => {
      this._type = 'PUT';
      this._data = data;
      return this;
   };

   ['delete'] = (data) => {
      this._type = 'DELETE';
      this._data = data;
      return this;
   };

   callback = (_callback) => {
      this._callback = _callback;
      return this;
   };

   credentials = (_credentials) => {
      this._credentials = _credentials;
      return this;
   };

   timeout = (_timeout) => {
      this._timeout = _timeout;
      return this;
   };

   headers = (_headers) => {
      this._headers = _headers;
      return this;
   };

   onStart = (action) => {
      this.initAction = action;
      return this;
   };

   onSuccess = (action) => {
      this.thenAction = action;
      return this;
   };

   onFail = (action) => {
      this.errorAction = action;
      return this;
   };

   ['do'] = (dispatch) => {
      this.initAction && dispatch(this.initAction());
      ajax({
         url: this.url,
         type: this._type,
         headers: this._headers,
         credentials: this._credentials,
         timeout: this._timeout,
         data: this._data,
         sessionErrorHandler: error => dispatch({
            type: 'authentication/SESSION_FAIL',
            fail: error
         })
      }).then(response => {
         if (!this._clear) {
            this.thenAction && dispatch(this.thenAction(response));
            this._callback && this._callback(response, 'SUCCESS');
         }
      }).catch(fail => {
         if (!this._clear) {
            this.errorAction && dispatch(this.errorAction(fail));
            this._callback && this._callback(fail, 'ERROR');
         }
      });
      return this;
   };
}

export const patchStoreToAjaxRequestActions = () => {
   let activeRequests = [];
   return store => dispatch => action => {
      if (action instanceof Ajax) {
         let index = activeRequests.map(item => item.url).indexOf(action.url);
         if (index !== -1) {
            activeRequests[index].clear();
            activeRequests[index] = action;
         } else {
            activeRequests[activeRequests.length] = action;
         }
         action.do(dispatch);
      } else {
         return dispatch(action);
      }
   };
};


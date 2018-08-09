import _ from 'lodash'

export const get = (object, property, defaultValue) => {
   let value = _.get(object, property, defaultValue);
   if (value === null) {
      return  defaultValue;
   }
   return value;
}

export function decl(number, titles) {
   const cases = [2, 0, 1, 1, 1, 2];
   return titles[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]];
}

export const timeoutLoader = time => {
   let timer = null;
   return (action) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(action, time);
   }
}

export const buildState = (pattern, ...fields) => {
   let result = {};
   fields.forEach(field => result[field] = _.cloneDeep(pattern));
   return result;
}

export const buildObject = (path, value) => {
   let result = {};
   let obj = result;
   path.split(".").forEach((item, index, arr) => {
      if (index === arr.length - 1) {
         obj[item] = value;
      } else {
         obj[item] = {};
         obj = obj[item];
      }
   });
   return result;
}

class DotProp {
   constructor(obj) {
      this.obj = obj;
   }

   setIf(cond, prop, value) {
      if (cond) {
         this.set(prop, value);
      }
      return this;
   }

   runIf(cond, action) {
      if (cond) {
         action()
      }
      return this
   }

   set(prop, value) {
      if (typeof value === "function") {
         value = value(this.obj);
      }
      prop = typeof prop === 'number' ? DotProp.propToArray(prop.toString()) : typeof prop === 'string' ? DotProp.propToArray(prop) : prop;
      const setPropImmutableRec = function (obj, prop, value, i) {
         let clone, head = prop[i];
         if (prop.length > i) {
            if (!Number.isNaN(Number.parseInt(prop[i], 10)) && _.isEmpty(obj)) {
               obj = []
            }
            if (Array.isArray(obj)) {
               head = DotProp.getArrayIndex(head, obj);
               clone = obj.slice();
            } else {
               clone = Object.assign({}, obj);
            }
            clone[head] = setPropImmutableRec(obj[head] !== undefined ? obj[head] : {}, prop, value, i + 1);
            return clone;
         }
         return typeof value === 'function' ? value(obj) : value;
      };
      this.obj = setPropImmutableRec(this.obj, prop, value, 0);
      return this;
   }

   get(prop, value) {
      if (!prop) {
         return this.obj;
      }
      prop = typeof prop === 'number' ? DotProp.propToArray(prop.toString()) : typeof prop === 'string' ? DotProp.propToArray(prop) : prop;
      for (let i = 0; i < prop.length; i++) {
         if (typeof this.obj !== 'object') {
            return value;
         }
         let head = prop[i];
         if (Array.isArray(this.obj) && head === '$end') {
            head = this.obj.length - 1;
         }
         this.obj = this.obj[head];
      }
      if (typeof this.obj === 'undefined') {
         return value;
      }
      return this.obj;
   }

   deleteIf(condition, prop) {
      if (condition) {
         this.delete(prop);
      }
      return this;
   }

   ['delete'](prop) {
      prop = typeof prop === 'number' ? DotProp.propToArray(prop.toString()) : typeof prop === 'string' ? DotProp.propToArray(prop) : prop;

      const deletePropImmutableRec = function (obj, prop, i) {
         let clone, head = prop[i];

         if (!obj || typeof obj !== 'object' || (!Array.isArray(obj) && obj[head] === undefined)) {
            return obj;
         }

         if (prop.length - 1 > i) {
            if (Array.isArray(obj)) {
               head = DotProp.getArrayIndex(head, obj);
               clone = obj.slice();
            } else {
               clone = Object.assign({}, obj);
            }

            clone[head] = deletePropImmutableRec(obj[head], prop, i + 1);
            return clone;
         }
         if (Array.isArray(obj)) {
            head = DotProp.getArrayIndex(head, obj);
            clone = [].concat(obj.slice(0, head), obj.slice(head + 1));
         } else {
            clone = Object.assign({}, obj);
            delete clone[head];
         }
         return clone;
      };
      this.obj = deletePropImmutableRec(this.obj, prop, 0);
      return this;
   }

   toggle(prop) {
      const curVal = _.get(this.obj, prop);
      this.set(prop, !Boolean(curVal));
      return this;
   }

   merge(prop, val) {
      let curVal = this.get(prop);
      if (typeof curVal === 'object') {
         if (Array.isArray(curVal)) {
            this.set(prop, curVal.concat(val));
            return this;
         } else if (curVal === null){
            this.set(prop, val);
            return this;
         } else {
            const merged = Object.assign({}, curVal, val);
            this.set(prop, merged);
            return this;
         }
      } else if (typeof curVal === 'undefined'){
         this.set(prop, val);
         return this;
      } else {
         return this;
      }
   }

   static getArrayIndex(head, obj) {
      if (head === '$end') {
         head = Math.max(obj.length - 1, 0);
      }
      if (!/^\+?\d+$/.test(head)) {
         throw new Error('Array index \'' + head + '\' has to be an integer');
      }
      return parseInt(head, 10);
   }

   static propToArray(prop) {
      return prop.replace(']', '').replace('[', '.').split('.').reduce(function (ret, el, index, list) {
         const last = index > 0 && list[index - 1];
         if (last && /(?:^|[^\\])\\$/.test(last)) {
            ret.pop();
            ret.push(last.slice(0, -1) + '.' + el);
         } else {
            ret.push(el);
         }
         return ret;
      }, []);
   }
}

export function update(obj) {
   return new DotProp(obj);
}

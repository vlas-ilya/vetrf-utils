class ReduceMaker {
   constructor(defaultState) {
      this.defaultState = defaultState;
      this.handlers = {};
      this.defaultHandler = (state, _) => state
   }

   addHandlers(actions, handler) {
      if (actions) {
         actions.forEach(action => this.addHandler(action, handler));
      }
      return this;
   }

   addHandler(action, handler) {
      if (action.type) {
         this.handlers[action.type] = handler;
      }
      return this;
   }

   make() {
      return (state = this.defaultState, action) => {
         const handler = this.handlers[action.type] || this.defaultHandler;
         return handler(state, action);
      }
   }
}

export function makeReducer(defaultState) {
   return new ReduceMaker(defaultState);
}

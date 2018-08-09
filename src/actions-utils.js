export function makeAction(type, ...argNames) {
   const result_action = function (...args) {
      let action = { type };
      argNames.forEach((arg, index) => {
         action[argNames[index]] = args[index]
      });
      return action;
   };
   result_action.type = type;
   return result_action;
}

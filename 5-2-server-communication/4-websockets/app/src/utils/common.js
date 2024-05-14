export function swapKeyValue(obj) {
  let ret = {};
  for(let key in obj){
    ret[obj[key]] = key;
  }
  return ret;
}

export function generateId(length) {
  let result           = '';
  let characters       = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'; // avoid chars that can be confused
  let charactersLength = characters.length;
  for ( let i = 0; i < length; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export default { swapKeyValue, generateId }

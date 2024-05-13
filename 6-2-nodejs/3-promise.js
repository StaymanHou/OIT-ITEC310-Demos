const delay = t => new Promise(resolve => setTimeout(resolve, t));

console.log("[promise] start");
delay(1000)
.then(() => {
  console.log("[promise] 1 done");
  return delay(1000);
})
.then(() => {
  console.log("[promise] 2 done");
  return delay(1000);
})
.then(() => {
  return console.log("[promise] 3 done");
})
.then(() => {
  // return console.log('[promise] All Done!'); // CORRECT
});
console.log('[promise] All Done!'); // WRONG!

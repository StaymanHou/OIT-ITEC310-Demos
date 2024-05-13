console.log("[callback] start");
setTimeout(() => {
  console.log("[callback] 1 done");
  setTimeout(() => {
    console.log("[callback] 2 done");
    setTimeout(() => {
      console.log("[callback] 3 done");
      // console.log('[callback] All Done!'); // CORRECT
    }, 1000);
  }, 1000);
}, 1000);
console.log('[callback] All Done!'); // WRONG!

// Callback Hell

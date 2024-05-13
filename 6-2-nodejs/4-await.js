const sleep = t => new Promise(resolve => setTimeout(resolve, t));

async function main() {
  console.log("[await] start");
  await sleep(1000);
  console.log("[await] 1 done");
  await sleep(1000);
  console.log("[await] 2 done");
  await sleep(1000);
  console.log("[await] 3 done");
  console.log("[await] all done");
}

main();

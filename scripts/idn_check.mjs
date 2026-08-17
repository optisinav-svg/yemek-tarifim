const names = ["mutfaksanatları.com", "mutfaksanatlari.com"];
for (const name of names) {
  console.log(`${name} -> ${new URL(`http://${name}`).hostname}`);
}

const urlStrings = [
  'http://localhost:5173/?token_hash=ABC&type=signup#/verify',
  'http://localhost:5173/#/verify?token_hash=DEF&type=signup'
];

urlStrings.forEach(s => {
  const url = new URL(s);
  console.log("For URL:", s);
  console.log("  url.search:", url.search);
  console.log("  url.hash:", url.hash);
  
  // Custom hash extraction
  const hashObj = url.hash.split('?');
  if (hashObj.length > 1) {
    const params = new URLSearchParams(hashObj[1]);
    console.log("  params from hash:", params.get('token_hash'), params.get('type'));
  }
});

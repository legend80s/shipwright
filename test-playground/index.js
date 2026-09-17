{
  const resp = await fetch("https://www.npmjs.com/package/shipwright/v/0.1.2/index")
  const json = await resp.json()

  console.log("json1", json)
}
{
  const resp = await fetch("https://registry.npmjs.org/shipwright")
  const json = await resp.json()

  console.log("json2", json)
}

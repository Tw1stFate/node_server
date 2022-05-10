var Koa = require("koa");
var Router = require("koa-router");
var fs = require("fs");
const path = require('path');
var bodyParser = require("koa-bodyparser");
const { fileURLToPath } = require("url");
const { resolve } = require("path");
const sqlite3 = require('sqlite3').verbose();
const exec=require('child_process').exec;

var app = new Koa();
var router = new Router();

app.use(bodyParser());

router.get("/", async (ctx, next) => {
  ctx.type = "html";
  ctx.body = fs.createReadStream(path.join(__dirname, 'index.html'));
});

router.post("/save", async (ctx, next) => {
  // new cookies
  const body = ctx.request.body
  let newCkObj = parseCookieStrToObj(body.cookies)
  if (JSON.stringify(newCkObj) === '{}') {
    ctx.response.body = 'cookie为空, 请检查格式是否正确!'
    return
  }
  await saveNewCookies(newCkObj)
  // restart ql
  await execShellCmd('docker restart qinglong')
  ctx.response.body = 'update success'

});

async function execShellCmd(cmdStr) {
  return new Promise((resolve, reject) => {
    exec(str,function(err,stdout,stderr){
      if (err){
        resolve()
      } else {
        reject()
      }
  })
}

async function saveNewCookies(newCkObj) {
  return new Promise((resolve, reject) => {
    // const db_path = path.join(__dirname, 'tdatabase.sqlite')
    const db_path = '/root/ql/db/database.sqlite'
    const db = new sqlite3.Database(db_path);
    db.serialize(() => {
      db.each("SELECT value FROM Envs", (err, row) => {
          // console.log(row.id + ": " + row.info);
          let ckObj = parseCookieStrToObj(row.value)
          Object.keys(newCkObj).forEach((key) => {
            ckObj[key] = newCkObj[key]
          })
          // convert to formattedCookies
          let formattedCookies = Object.keys(ckObj).map(key => ckObj[key] + key).join('&')
          db.run("UPDATE Envs SET value = ? WHERE id = ?", formattedCookies, 1)
          // close db
          db.close()

          resolve()
      });
    });
  })
}

function parseCookieStrToObj(cookiesString) {
  let ckObj = {}
  cookiesString.split('&').forEach(ck => {
    console.log(ck)
    k = ((ck || '').match(/(pt_key|pt_pin)=.+?;/g) || []).sort();
    if (k[0] !== undefined) {
        key = k[0]
        pin = k[1]
        ckObj[pin] = key
    }
  })  
  return ckObj
}

app.use(router.routes()).use(router.allowedMethods());
app.listen(3000);

console.log("server started at http:localhost:3000");
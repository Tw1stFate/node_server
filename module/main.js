var Koa = require("koa");
var Router = require("koa-router");
var fs = require("fs");
var bodyParser = require("koa-bodyparser");

var app = new Koa();
var router = new Router();

app.use(bodyParser());

router.get("/", async (ctx, next) => {
  ctx.type = "html";
  ctx.body = fs.createReadStream("index.html");
});

router.post("/save", async (ctx, next) => {
  ctx.body = ctx.request.body;
});

app.use(router.routes()).use(router.allowedMethods());
app.listen(3000);

console.log("server started at http:localhost:3000");
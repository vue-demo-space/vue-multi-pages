# vue-multi-pages

## 使用

```bash
# 开发
$ npm run serve

# 部署
$ npm run build
```

demo 总共有 4 个 url：

```
/demo0
/demo0/about
/demo1
/demo1/about
```

另外，没有做 webpack 配置的一系列优化

## 原理

vue 多页核心无非是配置多个 webpack 入口，vue cli3 让这变的更加简单，它有个 [pages](https://cli.vuejs.org/zh/config/#pages) 选项可以完美做到这一点

另外我觉得有两点比较重要：

* 多页下是个 spa，还是依旧是多页？
* 项目的目录结构问题

第一点，**demo 兼容了两者**，demo0 是个 spa，其下是个完整的带 vue-router 的 vue 项目；而 demo1 下依旧是个多页，demo1/index/ 和 demo1/about/ 可以看作分别是两个 vue 项目。**用哪个取决于我们是否需要 router**

换个角度理解，`/demo0` 跳到 `/demo0/about`，页面不刷新；`/demo1` 跳到 `/demo1/about`，页面刷新

第二点，项目目录结构会因人喜好而异，**目录结构包括开发结构和打包后线上的结构**。

先看 src 结构：

```
├── demo0
│   ├── App.vue
│   ├── main.js
│   ├── router.js
│   └── views
│       ├── About.vue
│       └── Home.vue
└── demo1
    ├── about
    │   ├── App.vue
    │   └── main.js
    └── index
        ├── App.vue
        └── main.js
```

这里我 src 下直接是项目了，有些时候可能会多个子目录，比如叫 pages，而与其并级的可能是 utils 这样

再看 dist 结构（看起来 public 目录下的文件会移到 dist 下，这个以后探究）：

```
├── css
│   └── demo1
├── demo0.html
├── demo1
│   ├── about.html
│   └── index.html
├── index.html
└── js
    └── demo1
```

有些人可能喜欢 `demo0/index.html` 以及 `demo1/about/index.html` 和 `/demo1/index/index.html` 这样的生成结构，都是可以的，**只是到时 nginx 配置上有些许差异而已**（我这样设计会导致配置复杂点）


## 配置

vue.config.js 配置：

```js
module.exports = {
  pages: {
    'demo0': {
      // page 的入口
      entry: 'src/demo0/main.js',
      // 模板来源
      template: 'public/index.html',
    },
    'demo1/index': {
      // page 的入口
      entry: 'src/demo1/index/main.js',
      // 模板来源
      template: 'public/index.html',
    },
    'demo1/about': {
      // page 的入口
      entry: 'src/demo1/about/main.js',
      // 模板来源
      template: 'public/index.html',
    }
  }
}
```

甚至我们连 template 都可以不配置，因为 @vue/cli-service 贴心地为什么提供了 default template（可以删除我们的配置，然后 `vue inspect > output.js` 导出进行配置查看）

当然如果多项目的话一个一个列出来太繁琐了，我们可以用程序去做（程序因每个人的目录结构而异）：

```js
function generatePages() {
  const pages = {}
  glob.sync('./src/**/main.js').forEach(path => {
    console.log(path)
    const chunk = path.split('./src/')[1].split('/main.js')[0]
    pages[chunk] = {
      entry: path,
      template: 'public/index.html'
    }
  })
  return pages
}
```

### 开发环境

在开发环境下 demo1 运行良好，demo0 有个小问题

提一点，首先代码中我们得为 demo0 的 router 设定 base 值：

```js
export default new Router({
  mode: 'history',
  // 关键！
  base: '/demo0/',
  routes: [
    // ... 略
  ]
})
```

我们可以看到渲染后的路由地址：

![](https://ws2.sinaimg.cn/large/006tKfTcly1g0lstwdfdbj30oe04y74x.jpg)

所以我们从 `/demo0/about/` 页面回去的时候，地址会是 `/demo0/`，**这个问题生产环境依然存在**，我觉得解决不了，因为这是单页之间的路由转换，不走 nginx 配置

### 生产环境

最后是 nginx 上的配置

这里为了方便说明，假设 demo 运行于 www.test.com 的域名下，所以 **理想情况下** demo 的四个地址是：

```
http://www.test.com/demo0
http://www.test.com/demo0/about
http://www.test.com/demo1
http://www.test.com/demo1/aout
```

首先 <http://www.test.com/demo0> 是打不开的，因为实际地址是 <http://www.test.com/demo0.html>，我们需要配置 try_files（如果 dist 目录是上面说的另一种结构，就不会有这个问题）：

```nginx
location / {
  root /Users/fish/github/demo-space/vue-multi-pages/dist;
  try_files $uri $uri/ $uri.html;
}
```

然后 <http://www.test.com/demo0/about> 500。demo0 作为 spa，我们的配置可能已经驾轻就熟了，参考 [这里](https://router.vuejs.org/zh/guide/essentials/history-mode.html#nginx)

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

对于一个普通的 spa，当找不到路径地址的时候，会回退到根目录下的 index.html 文件，但是 demo0 我们需要回退到的是 demo0.html 文件，我们需要先 try_files 到 /demo0 然后，/demo0 会到 /demo.html

```nginx
location / {
  root /Users/fish/github/demo-space/vue-multi-pages/dist;
  try_files $uri $uri/ $uri.html @router;
}
location @router {
  rewrite ^(/(.+?))/ $1 last;
}
```

事实上，这样配置的话，打开 <http://www.test.com/demo0/> 也会回退到 <http://www.test.com/demo0>，不然 <http://www.test.com/demo0/> 也是 500 的

demo 还有个问题，有时候地址会变成 <http://www.test.com/demo0/> 以及 <http://www.test.com/demo1/>，不影响使用，但是如果我们强行不要最后的 `/`，也可以进行配置：

```
# 强行不要 url 地址最后的 /
rewrite ^(/(.+))/$ $1 permanent;
```

但是这样配置后，<http://www.test.com/demo1/> 会打不开，我的理解是打开 <http://www.test.com/demo1> 会被 301 到 <http://www.test.com/demo1/>，不知道这是哪里配置的，反正 `curl http://www.test.com/demo1` 可以看到它被 301 了，如果再把它 301 到 <http://www.test.com/demo1>，会陷入死循环

关于这个我们随便写个目录：

```
└── a
    └── index.html
```

然后用 http-server 起个 server，打开它看到地址是 <http://127.0.0.1:8081/a/>，可能会是一个原因

为啥会自动添加 `/`，还需要后续研究，这是另外一个问题了，这里不讨论

最后的 nginx 配置如下：

```nginx
server {
  listen 80;
  server_name www.test.com;
  location / {
    root /Users/fish/github/demo-space/vue-multi-pages/dist;
    index  index.html index.htm;

    # 强行不要 url 地址最后的 /
    # rewrite ^(/(.+))/$ $1 permanent;

    try_files $uri $uri/ $uri.html @router;
  }
  location @router {
    # spa 页面指向根路径 
    rewrite ^(/(.+?))/ $1 last;
  }
}
```

**其实对于 demo1 来说，url 上完全可以带上 \.html 的后缀，因为其本身就是一个个 html 单页面**


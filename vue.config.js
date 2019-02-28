const glob = require('glob')

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

module.exports = {
  pages: generatePages(),
  // pages: {
  //   'demo0': {
  //     // page 的入口
  //     entry: 'src/demo0/main.js',
  //     // 模板来源
  //     template: 'public/index.html',
  //   },
  //   'demo1/index': {
  //     // page 的入口
  //     entry: 'src/demo1/index/main.js',
  //     // 模板来源
  //     template: 'public/index.html',
  //   },
  //   'demo1/about': {
  //     // page 的入口
  //     entry: 'src/demo1/about/main.js',
  //     // 模板来源
  //     template: 'public/index.html',
  //   }
  // }
}
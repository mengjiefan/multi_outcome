const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  lintOnSave:false,    //关闭语法检查
  assetsDir: 'static',// 静态资源打包输出目录 (js, css, img, fonts)，相应的url路径也会改变
 configureWebpack: {
  devtool: 'source-map'
 }
//开启代理服务器，方式一：此种方法1.只能访问一个代理；2.当项目下的public文件下
  //有目标文件同名文件时，会无法判断要不要访问代理   
  // devServer:{
  //   proxy:'http://localhost:8000'
  // }

//开启代理服务器，方式二：可规避上述方法中的两种问题   
  // devServer: {
  //   proxy: {
  //       '/api': {
  //           target: 'http://localhost:8000',
  //           changeOrigin: true,
  //           ws: true,   //用于支持websocket
  //           //实际要访问的是8000端口下的/targetFile文件，pathRewrite是为了避免访问的是8000端口下的/api/targetFile
  //           pathRewrite: {
  //               '^/api': ''
  //           }
  //       }
        //第二个代理demo
      //   ,
      //   '/demo': {
      //     target: 'http://localhost:8001',
      //     changeOrigin: true,
      //     ws: true,   //用于支持websocket
      //     //实际要访问的是8000端口下的/targetFile文件，pathRewrite是为了避免访问的是8000端口下的/api/targetFile
      //     pathRewrite: {
      //         '^/demo': ''
      //     }
      // }
    
//     }
// },

})

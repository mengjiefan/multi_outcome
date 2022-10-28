module.exports = {
    presets: [
      '@vue/cli-plugin-babel/preset',
      ["@babel/preset-env", { "modules": false }]
    ],
    "plugins": [
      [
        // "@babel/plugin-transform-runtime",
        "component",
        {
          "libraryName": "element-ui",
          "styleLibraryName": "theme-chalk"
        }
      ]
      // ,
      // [
      //   "transform-runtime",
      //   {
      //     "helpers": false,
      //     "polyfill": false,
      //     "regenerator": true,
      //     "moduleName": "babel-runtime"
      //   }
      // ]
    ]
  }
  
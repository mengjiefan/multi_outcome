// https://blog.csdn.net/qq_49867247/article/details/123493323
// 事件总线的原理就是：
// 创建一个公共的Js文件，让其专门负责传值。就像公共的交通工具bus，data可以乘坐这辆bus到达指定的站台（相应的组件）
// 那么首先要做的就是在我们的项目中创造这辆bus
// 1.闭门造车（创建公用JS文件）

// 首先得在城市中（src目录下）租块地（创建一个文件夹），放置这辆bus。
// bus.js的创建十分简单，只要粘贴以下代码：
import Vue from 'vue';
export default new Vue;

// 2.上车
// 既然坐车就要刷卡，刷卡的方式也很简单，在需要传递数据的组件中引入bus.js
// import bus from '../componentsInteraction/bus.js';

// 之后bus出发，在该组件中发射事件，发射事件需要一个媒介，在本篇就用button的click事件触发：
// <button @click="appmsg">bus传递data</button>


// 事件总线方式是一个十分方便的方法，但是：
// 事件总线方式传递数据同时需要及时的移除事件监听，这对于初学者是个麻烦事
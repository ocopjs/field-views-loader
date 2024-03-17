<!--[meta]
title: Field Views Loader
[meta]-->

# Field Views Loader

> Lưu ý sau khi phiên bản KeystoneJS 5 chuyển sang chế độ duy trì để ra mắt
> phiên bản mới hơn. Chúng tôi đã dựa trên mã nguồn cũ này để phát triển một
> phiên bản khác với một số tính năng theo hướng microservices.

OcopJS - Để nạp tất cả giao diện ô nhập sử dụng trên ứng dụng.

> Gói này chứa [webpack loader](https://webpack.js.org/api/loaders) sử dụng để
> tạo ô nhập liệu trên giao diện Admin UI.

Gói này là một dạng Helper sử dụng nội bộ bởi @ocopjs. Bạn không nên sử dụng
trực tiếp vào dự án.

```js
// adminMeta gives us a `lists` object in the shape:  -->
const config = {
  pages: [
    {
      label: "Hello World",
      path: "/hello",
      component: "absolute/path/to/page",
    },
  ],
  lists: {
    [listPath]: { // e.g "User"
      access: { create, read, update, delete, auth },
      views: {
        [fieldPath]: { // e.g 'email'
          Controller: "absolute/path/to/controller",
          [fieldTypeView]: "absolute/path/to/view", // e.g 'Field'
          [fieldTypeView]: "another/absolute/path", // e.g 'Column'
        },
      },
    },
  },
};

// and our loader simply transforms it into usable code that looks like this:

module.exports = {
  "__pages__": {
    "/hello": require("absolute/path/to/page"),
  },
  "User": {
    "email": {
      Controller: require("absolute/path/to/controller"),
      Field: require("relative/path/to/view"),
      Column: require("another/relative/path"),
    },
  },
};
```

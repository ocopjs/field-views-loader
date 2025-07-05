import fs from "fs";
import { getOptions } from "loader-utils";

function serialize(value, allPaths) {
  if (typeof value === "string") {
    allPaths.add(value);
    return `loaders[${JSON.stringify(value)}]`;
  }
  if (Array.isArray(value)) {
    return `[${value.map((val) => serialize(val, allPaths)).join(", ")}]`;
  }
  if (typeof value === "object" && value !== null) {
    return (
      "{\n" +
      Object.keys(value)
        .filter((key) => value[key] !== undefined)
        .map((key) => {
          // we need to use getters so circular dependencies work
          return `${JSON.stringify(key)}: ${serialize(value[key], allPaths)}`;
        })
        .join(",\n") +
      "}"
    );
  }
  throw new Error("cannot serialize value of type: " + typeof value);
}

function findPageComponents(pages, pageComponents = {}) {
  if (!Array.isArray(pages)) return pageComponents;
  pages.forEach((page) => {
    if (page.component) pageComponents[page.path] = page.component;
    else if (page.children) {
      findPageComponents(page.children, pageComponents);
    }
  });
  return pageComponents;
}

module.exports = function () {
  const { pages, hooks, listViews } = getOptions(this);

  const allViews = {
    ...listViews,
    __pages__: findPageComponents(pages),
    __hooks__: fs.existsSync(hooks) ? hooks : {},
  };
  let allPaths = new Set();
  const stringifiedObject = serialize(allViews, allPaths);

  let loaders = `{\n${[...allPaths]
    .map((path) => {
      return `${JSON.stringify(path)}: () => import(${JSON.stringify(
        path,
      )}).then(interopDefault)`;
    })
    .join(",\n")}\n}`;

  const source = `
    import { captureSuspensePromises } from '@ocopjs/utils';
    let promiseCache = new Map();
    let valueCache = new Map();

    function loadView(view) {
      if (promiseCache.has(view)) {
        return promiseCache.get(view);
      }
      let promise = view().then(value => {
        valueCache.set(view, value);
      });
      promiseCache.set(view, promise);
      return promise;
    }

    export function preloadViews(views) {
      views.forEach(loadView);
    }

    export function readViews(views) {
      return captureSuspensePromises(
        views.map(view => () => {
          let viewFn = view;
          if (typeof view === 'string') {
            viewFn = loaders[view];
            if (!viewFn) {
              throw new Error('Unknown view path ' + view);
            }
          }
          if (valueCache.has(viewFn)) {
            return valueCache.get(viewFn);
          } else {
            throw loadView(viewFn);
          }
        })
      );
    }

    function interopDefault(mod) {
      return mod.default ? mod.default : mod;
    }

    let loaders = ${loaders};

    export let views = ${stringifiedObject}`;

  return source;
};

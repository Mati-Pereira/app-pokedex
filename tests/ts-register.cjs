// Lets tests require TypeScript sources (e.g. lib/*.ts) without a build step.
const fs = require('node:fs');
const Module = require('node:module');
const ts = require('typescript');

Module._extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  });
  module._compile(outputText, filename);
};

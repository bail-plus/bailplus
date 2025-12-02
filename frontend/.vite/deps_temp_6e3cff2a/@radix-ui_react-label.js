"use client";
import {
  Primitive
} from "./chunk-FQJ3NWGV.js";
import "./chunk-RN6KYK5E.js";
import "./chunk-ZQ665P5K.js";
import {
  require_jsx_runtime
} from "./chunk-GW46PN6M.js";
import {
  require_react
} from "./chunk-NYFK7JJA.js";
import {
  __toESM
} from "./chunk-OL46QLBJ.js";

// ../node_modules/@radix-ui/react-label/dist/index.mjs
var React = __toESM(require_react(), 1);
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
var NAME = "Label";
var Label = React.forwardRef((props, forwardedRef) => {
  return (0, import_jsx_runtime.jsx)(
    Primitive.label,
    {
      ...props,
      ref: forwardedRef,
      onMouseDown: (event) => {
        var _a;
        const target = event.target;
        if (target.closest("button, input, select, textarea")) return;
        (_a = props.onMouseDown) == null ? void 0 : _a.call(props, event);
        if (!event.defaultPrevented && event.detail > 1) event.preventDefault();
      }
    }
  );
});
Label.displayName = NAME;
var Root = Label;
export {
  Label,
  Root
};
//# sourceMappingURL=@radix-ui_react-label.js.map

const defaultTheme = require("tailwindcss/defaultTheme");

// script adapted from https://github.com/tailwindlabs/tailwindcss/issues/1232
function rem2px(input, fontSize = 16) {
  if (input == null) {
    return input;
  }
  switch (typeof input) {
    case "object":
      if (Array.isArray(input)) {
        return input.map((val) => rem2px(val, fontSize));
      } else {
        const ret = {};
        for (const key in input) {
          ret[key] = rem2px(input[key]);
        }
        return ret;
      }
    case "string":
      return input.replace(
        /(\d*\.?\d+)rem$/,
        (_, val) => parseFloat(val) * fontSize + "px"
      );
    default:
      return input;
  }
}

const conifg = {
  important: true,
  theme: {
    borderRadius: rem2px(defaultTheme.borderRadius),
    columns: rem2px(defaultTheme.columns),
    fontSize: rem2px(defaultTheme.fontSize),
    lineHeight: rem2px(defaultTheme.lineHeight),
    minHeight: rem2px(defaultTheme.minHeight),
    minWidth: rem2px(defaultTheme.minWidth),
    spacing: rem2px(defaultTheme.spacing),
  },
};

console.log(JSON.stringify(conifg));

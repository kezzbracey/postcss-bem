# PostCSS Bem [![Build Status][ci-img]][ci]

[PostCSS] plugin implementing BEM as at-rules.

[PostCSS]: https://github.com/postcss/postcss
[ci-img]:  https://travis-ci.org/ileri/postcss-bem.svg
[ci]:      https://travis-ci.org/ileri/postcss-bem

```css
@utility utilityName {
    color: green;
}

@utility utilityName small {
    color: blue;
}

@component ComponentName {
    color: cyan;

    @modifier modifierName {
        color: yellow;
    }

    @descendent descendentName {
        color: navy;
    }

    @when stateName {
        color: crimson;
    }
}

@component-namespace nmsp {
    @component ComponentName {
        color: red;
    }
}
```

```css
.u-utilityName {
    color: green;
}

.u-sm-utilityName {
    color: blue;
}

.ComponentName {
    color: cyan;
}

.ComponentName--modifierName {
    color: yellow;
}

.ComponentName-descendentName {
    color: navy;
}

.ComponentName.is-stateName {
    color: crimson;
}

.nmsp-ComponentName {
    color: red;
}
```

## Usage

```js
postcss([ require('postcss-bem') ])
```

See [PostCSS] docs for examples for your environment.

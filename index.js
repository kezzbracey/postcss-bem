var postcss = require('postcss');

module.exports = postcss.plugin('postcss-bem', function (opts) {
    opts = opts || {};

    function processComponent (component, namespace) {
        var name = component.params;

        if (namespace) {
            name = namespace + '-' + name;
        }

        var last = component;
        component.each(function (rule) {
            var separator;
            var newRule;

            if (rule.type === 'atrule') {
                if (rule.name === 'modifier') {
                    separator = '--';
                } else if (rule.name === 'descendent') {
                    separator = '-';
                } else if (rule.name === 'is') {
                    separator = '.';
                }

                if(separator) {
                    newRule = postcss.rule({
                        selector: '.' + name + separator + rule.params,
                        nodes: rule.nodes
                    });
                    component.parent.insertAfter(last, newRule);
                    last = newRule;
                    rule.removeSelf();
                }
            }
        });

        component.replaceWith(postcss.rule({
            selector: '.' + name,
            nodes: component.nodes
        }));
    }

    return function (css, result) {
        css.eachAtRule('utility', function (utility) {
            var params = postcss.list.comma(utility.params);
            var variant;
            var name;

            if (params.length === 1 && !params[0] || params.length > 2) {
                result.warn('Wrong param count for @utility', {
                    node: utility
                });
            }

            name = 'u-';
            if (params.length > 1) {
                variant = params[1];

                if (variant === 'small') {
                    name += 'sm';
                } else if (variant === 'medium') {
                    name += 'md';
                } else if (variant === 'large') {
                    name += 'lg';
                } else {
                    result.warn('Unknown variant: ' + variant, {
                        node: utility
                    });
                }
                name += '-';
            }
            name += params[0];

            utility.replaceWith(postcss.rule({
                selector: '.' + name,
                nodes: utility.nodes
            }));
        });

        css.eachAtRule('namespace', function (namespace) {
            namespace.eachAtRule('component', function (component) {
                processComponent(component, namespace.params);
            });

            var node = namespace.last;
            while (node) {
                node.moveAfter(namespace);
                node = namespace.last;
            }
            namespace.removeSelf();
        });

        css.eachAtRule('component', function (component) {
            processComponent(component);
        });
        //process.exit();
    };
});

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
                } else if (rule.name === 'when') {
                    separator = '.is-';
                }

                if(separator) {
                    newRule = postcss.rule({
                        selector: '.' + name + separator + rule.params,
                        nodes: rule.nodes,
                        source: rule.source
                    });
                    component.parent.insertAfter(last, newRule);
                    last = newRule;
                    rule.removeSelf();
                }
            }
        });

        component.replaceWith(postcss.rule({
            selector: '.' + name,
            nodes: component.nodes,
            source: component.source
        }));
    }

    return function (css, result) {
        var namespaces = {};

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
                nodes: utility.nodes,
                source: utility.source
            }));
        });

        css.eachAtRule('namespace', function (namespace) {
            var name = namespace.params;

            if (!namespace.nodes) {
                namespaces[namespace.source.input.file || namespace.source.input.id] = name;
                namespace.removeSelf();
                return;
            }

            namespace.eachAtRule('component', function (component) {
                processComponent(component, name);
            });

            var node = namespace.last;
            while (node) {
                node.moveAfter(namespace);
                node = namespace.last;
            }
            namespace.removeSelf();
        });

        css.eachAtRule('component', function (component) {
            var namespace = opts.defaultNamespace;
            var id = component.source.input.file || component.source.input.id;
            if (id in namespaces) {
                namespace = namespaces[id];
            }

            processComponent(component, namespace);
        });
    };
});

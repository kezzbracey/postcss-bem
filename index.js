var postcss = require('postcss');
var config = {
    suit: {
        separators: {
            namespace: '-',
            descendent: '-',
            modifier: '--',
            state: '.is-'
        }
    },
    bem: {
        separators: {
            namespace: '--',
            descendent: '__',
            modifier: '_'
        }
    }
};

module.exports = postcss.plugin('postcss-bem', function (opts) {
    opts = opts || {};

    if (!opts.style) {
        opts.style = 'suit';
    }

    if (opts.style !== 'suit' && opts.style !== 'bem') {
        throw new Error('postcss-bem: opts.style may only be "suit" or "bem"');
    }

    var currentConfig = config[opts.style];

    function processComponent (component, namespace) {
        var name = component.params;

        if (namespace) {
            name = namespace + currentConfig.separators.namespace + name;
        }

        var last = component;
        var newComponent = postcss.rule({
            selector: '.' + name,
            source: component.source
        });
        component.each(function (rule) {
            var separator;
            var newRule;

            if (rule.type === 'atrule') {
                if (rule.name === 'modifier') {
                    separator = currentConfig.separators.modifier;
                } else if (rule.name === 'descendent') {
                    separator = currentConfig.separators.descendent;
                }

                if(separator) {
                    newRule = postcss.rule({
                        selector: '.' + name + separator + rule.params,
                        source: rule.source
                    });
                    rule.each(function (node) {
                        node.moveTo(newRule);
                    });
                    component.parent.insertAfter(last, newRule);
                    last = newRule;
                    rule.removeSelf();
                }
            }
            if (!separator) {
                rule.moveTo(newComponent);
            }
        });

        component.replaceWith(newComponent);
    }

    return function (css, result) {
        var namespaces = {};

        if (opts.style === 'suit') {
            css.eachAtRule('utility', function (utility) {
                if (!utility.params) {
                    throw utility.error('No names supplied to @utility');
                }

                var utilityNames = postcss.list.comma(utility.params);

                var selector = utilityNames.map(function (params) {
                    params = postcss.list.space(params);
                    var variant;
                    var name;

                    if (params.length > 2) {
                        result.warn('Too many parameters for @utility', {
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
                    return '.' + name;
                }).join(', ');

                var newUtility = postcss.rule({
                    selector: selector,
                    source: utility.source
                });

                utility.each(function (node) {
                    node.moveTo(newUtility);
                });
                utility.replaceWith(newUtility);
            });
        }

        css.eachAtRule('component-namespace', function (namespace) {
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

        if (opts.style === 'suit') {
            css.eachAtRule('when', function (when) {
                var parent = when.parent;

                if (parent === css || parent.type !== 'rule') {
                    throw when.error('@when can only be used in rules which are not the root node');
                }

                var states = when.params;
                var newSelector = postcss.list.comma(parent.selector).map(function (selector) {
                    return postcss.list.comma(states).map(function (state) {
                        return selector + currentConfig.separators.state + state;
                    }).join(', ');
                }).join(', ');

                var newWhen = postcss.rule({
                    selector: newSelector,
                    source: when.source
                });

                when.each(function (node) {
                    node.moveTo(newWhen);
                });
                newWhen.moveAfter(parent);
                when.removeSelf();
            });
        }
    };
});

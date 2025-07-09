const t = require('@babel/types');

module.exports = {
    presets: [
        [
            '@babel/preset-env',
            {
                modules: false,
                bugfixes: true,
                useBuiltIns: false,
                shippedProposals: false,
                exclude: ['@babel/plugin-transform-typeof-symbol']
            }
        ],
        '@babel/preset-typescript'
    ],
    assumptions: {
        setSpreadProperties: true
    },
    plugins: [
        ['@babel/plugin-transform-object-rest-spread', { useBuiltIns: true }],

        function transformIncludesAndStripExports() {
            return {
                name: 'transform-includes-and-strip-exports',
                visitor: {
                    CallExpression(path) {
                        const callee = path.node.callee;

                        // Transform `includes` → `indexOf >= 0`
                        if (
                            t.isMemberExpression(callee) &&
                            t.isIdentifier(callee.property, {
                                name: 'includes'
                            })
                        ) {
                            const indexOfCall = t.callExpression(
                                t.memberExpression(
                                    callee.object,
                                    t.identifier('indexOf')
                                ),
                                path.node.arguments
                            );
                            const comparison = t.binaryExpression(
                                '>=',
                                indexOfCall,
                                t.numericLiteral(0)
                            );
                            path.replaceWith(comparison);
                            return; // Done for this match
                        }

                        // Transform `Object.assign` → `clone`
                        if (
                            t.isMemberExpression(path.node.callee) &&
                            t.isIdentifier(path.node.callee.object, {
                                name: 'Object'
                            }) &&
                            t.isIdentifier(path.node.callee.property, {
                                name: 'assign'
                            })
                        ) {
                            path.replaceWith(
                                t.callExpression(
                                    t.identifier('clone'),
                                    path.node.arguments
                                )
                            );
                            return;
                        }
                    },

                    ExportNamedDeclaration(path) {
                        path.remove();
                    },
                    ExportDefaultDeclaration(path) {
                        path.remove();
                    }
                }
            };
        }
    ]
};

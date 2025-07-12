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
        [
            '@babel/plugin-transform-block-scoping',
            { throwIfClosureRequired: true }
        ],

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
                            t.isMemberExpression(callee) &&
                            t.isIdentifier(callee.object, { name: 'Object' }) &&
                            t.isIdentifier(callee.property, { name: 'assign' })
                        ) {
                            path.replaceWith(
                                t.callExpression(
                                    t.identifier('clone'),
                                    path.node.arguments
                                )
                            );
                            return; // Done for this match
                        }

                        // Transform `f(...args)` → `f.apply(this, args)`
                        if (
                            path.node.arguments.some((arg) =>
                                t.isSpreadElement(arg)
                            )
                        ) {
                            const spreadArg = path.node.arguments.find((arg) =>
                                t.isSpreadElement(arg)
                            );
                            if (spreadArg) {
                                path.replaceWith(
                                    t.callExpression(
                                        t.memberExpression(
                                            callee,
                                            t.identifier('apply')
                                        ),
                                        [t.thisExpression(), spreadArg.argument]
                                    )
                                );
                                return; // Done for this match
                            }
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

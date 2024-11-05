module.exports = {
    extends: [
        'eslint:recommended',
        "plugin:vue/vue3-strongly-recommended"
    ],
    rules: {
        semi: ['error', 'always'],
        quotes: ['error', 'single'],
        indent: ['error', 4],
        'comma-spacing': ['error', { before: false, after: true }]
    },
    plugins: ["vue"]
}
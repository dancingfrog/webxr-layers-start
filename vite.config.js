import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";
import { NodeModulesPolyfillPlugin } from "@esbuild-plugins/node-modules-polyfill";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default {
    base: "",
    define: {
       // "process.env.MapboxAccessToken": JSON.stringify(process.env.MapboxAccessToken)
    },
    // Vite 6 defaults to scanning **/*.html for deps; public/verge3d-code-examples use
    // three/nodes (not in three's package exports) and would break dep-scan. Only scan the app.
    optimizeDeps: {
        entries: ["index.html"],
        esbuildOptions: {
            plugins: [
                NodeGlobalsPolyfillPlugin({
                    process: true,
                    buffer: true
                }),
                NodeModulesPolyfillPlugin()
            ]
        }
    },
    resolve: {
        alias: [
            // {
            //     find: "@", replacement: resolve(__dirname, "./src"),
            // },
            {
                find: "./runtimeConfig", replacement: "./runtimeConfig.browser"
            },
            {
                find: "util",
                replacement: "rollup-plugin-node-polyfills/polyfills/util"
            }
        ]
    },
    server: { https: true }, // Not needed for Vite 5+
    plugins: [
        basicSsl({
            /** name of certification */
            name: 'test',
            // /** custom trust domains */
            // domains: ['*.custom.com'],
            // /** custom certification directory */
            // certDir: '/Users/.../.devServer/cert'
        }),
    ]
};

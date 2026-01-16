import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "churchthreads",
        start_url: "/",
        display: "standalone",
        background_color: "#5A618A",
        theme_color: "#5A618A",
        icons: [
            {
                src: "logo.png",
                sizes: "any"
            }
        ]
    };
}

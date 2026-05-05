// import { getDataUrl } from "./dataUrl";

const DEFAULT_CONFIG = {
  apiBaseUrl: "https://www.efftime.com/webservices/freelancer/",
  freelancerApiBaseUrl: "https://www.efftime.com/webservices/freelancer/",
};

let configPromise = null;

export async function getRuntimeConfig() {
  if (!configPromise) {
    // configPromise = fetch(getDataUrl("config/app-config.json"), {
    //   cache: "no-store",
    // })
    //   .then(async (response) => {
    //     if (!response.ok) {
    //       throw new Error(`HTTP ${response.status}`);
    //     }
    //     const config = await response.json();
    //     return { ...DEFAULT_CONFIG, ...config };
    //   })
    //   .catch((error) => {
    //     console.error("Unable to load runtime config:", error);
    //     return DEFAULT_CONFIG;
    //   });

    configPromise = Promise.resolve(DEFAULT_CONFIG);
  }

  return configPromise;
}

import next from "eslint-config-next";

const config = [...next, { ignores: [".next/**", "node_modules/**", "scripts/**", ".agents/**", ".claude/**", ".taste-skill/**"] }];
export default config;

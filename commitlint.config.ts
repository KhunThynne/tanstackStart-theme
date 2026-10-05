import { RuleConfigSeverity, type UserConfig } from "@commitlint/types";
const Configuration = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "subject-case": [RuleConfigSeverity.Disabled],
    "subject-full-stop": [RuleConfigSeverity.Disabled, "never", "."],
    // "header-max-length": [RuleConfigSeverity.Error, "always", 300],
    // "body-max-line-length": [RuleConfigSeverity.Error, "always", 1000],
    // "footer-max-line-length": [RuleConfigSeverity.Error, "always", 1000],
  },
} satisfies UserConfig;
export default Configuration;

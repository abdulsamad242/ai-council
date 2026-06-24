import "dotenv/config";
import { classifySourceCredibility } from "./utils/credibility-check.js";

async function main() {
  // The exact source that slipped through with an unhedged "70%" claim in the last run
  const knownProblematic = {
    content:
      "Study shows AI systems fail accuracy tests about 70 percent of the time. A new study has found that AI systems are making mistakes around 70% of the time when given various tasks, raising concerns about reliability. The success rate of AI systems might only be around 30%.",
    url: "https://community.latenode.com/t/study-shows-ai-systems-fail-accuracy-tests-about-70-percent-of-the-time/31638",
  };

  console.log("Testing classification on the known problematic source...\n");
  console.log("URL:", knownProblematic.url);
  console.log("Content:", knownProblematic.content, "\n");

  const result = await classifySourceCredibility([knownProblematic]);

  console.log("CLASSIFICATION RESULT:");
  console.log("Credibility:", result[0].credibility);
  console.log("Reason:", result[0].reason);

  console.log("\n--- DIAGNOSIS ---");
  if (result[0].credibility === "reliable") {
    console.log("❌ LAYER 1 FAILURE: The classifier itself wrongly trusts this forum source.");
    console.log("This points to a model capability issue, or the classification prompt needs to be more explicit about forum/community URL patterns.");
  } else {
    console.log("✅ Classifier correctly flagged this as low-confidence.");
    console.log("This means the failure is happening LATER - in verifyEvidence or the final statement prompt not respecting the credibility tag.");
    console.log("This would be a prompt/logic bug, not a model capability issue.");
  }
}

main();
#!/usr/bin/env node
/**
 * E2E OMR Integration Test
 *
 * Tests the full import flow: upload → OMR submit → poll → result
 *
 * Usage:
 *   node scripts/test_omr_e2e.mjs
 *
 * Requires backend running at http://localhost:8000
 */

const BASE_URL = process.env.API_URL || "http://localhost:8000/imports";

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testHealth() {
  console.log("\n1. Checking backend health...");
  const response = await fetch(`${BASE_URL}/health`);
  const data = await response.json();
  console.log("   Status:", data.status);
  console.log("   OMR Provider:", data.omr_provider);
  console.log("   OMR Available:", data.omr_available);

  if (data.status !== "healthy") {
    throw new Error("Backend not healthy");
  }
  return data;
}

async function requestSignedUrl(fileName) {
  console.log("\n2. Requesting signed URL...");
  const response = await fetch(`${BASE_URL}/upload/signed-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      file_name: fileName,
      mime_type: "image/jpeg",
      source_type: "photo",
      file_size: 1000,
    }),
  });
  const data = await response.json();
  console.log("   Asset ID:", data.asset_id);
  console.log("   Success:", data.success);

  if (!data.success || !data.asset_id) {
    throw new Error("Failed to get signed URL: " + data.error);
  }
  return data;
}

async function uploadFile(assetId) {
  console.log("\n3. Uploading test file...");

  // Create a minimal test file using FormData
  const boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
  const testFileContent = "fake image content for testing";

  const body = [
    `--${boundary}`,
    'Content-Disposition: form-data; name="file"; filename="test.jpg"',
    "Content-Type: image/jpeg",
    "",
    testFileContent,
    `--${boundary}`,
    'Content-Disposition: form-data; name="source_type"',
    "",
    "photo",
    `--${boundary}--`,
  ].join("\r\n");

  const response = await fetch(`${BASE_URL}/upload/direct/${assetId}`, {
    method: "POST",
    headers: {
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
    },
    body,
  });
  const data = await response.json();
  console.log("   Success:", data.success);
  console.log("   Asset ID:", data.asset_id);
  console.log("   URL:", data.url);

  if (!data.success) {
    throw new Error(
      "Upload failed: " + (data.error || data.detail || JSON.stringify(data)),
    );
  }
  return data;
}

async function submitOmrJob(assetId) {
  console.log("\n4. Submitting OMR job...");
  const response = await fetch(`${BASE_URL}/omr/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      asset_id: assetId,
      source_type: "photo",
    }),
  });
  const data = await response.json();
  console.log("   Success:", data.success);
  console.log("   Job ID:", data.job_id);
  console.log("   Estimated Duration:", data.estimated_duration_ms, "ms");

  if (!data.success || !data.job_id) {
    throw new Error("OMR submit failed: " + data.error);
  }
  return data;
}

async function pollOmrStatus(jobId, maxAttempts = 15) {
  console.log("\n5. Polling OMR status...");

  for (let i = 1; i <= maxAttempts; i++) {
    const response = await fetch(`${BASE_URL}/omr/status/${jobId}`);
    const data = await response.json();
    const status = data.status;
    const progress = data.progress || 0;

    console.log(`   Poll ${i}: status=${status}, progress=${progress}%`);

    if (status === "completed") {
      console.log("\n=== OMR COMPLETED ===");
      console.log("   Confidence:", data.result?.confidence);
      console.log("   Title:", data.result?.metadata?.title);
      console.log("   Measures:", data.result?.measure_count);
      console.log(
        "   MusicXML length:",
        data.result?.music_xml?.length || 0,
        "chars",
      );
      return data;
    }

    if (status === "failed") {
      throw new Error("OMR job failed: " + data.error);
    }

    await sleep(1000);
  }

  throw new Error("OMR job timed out");
}

async function runTest() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║        Sound First OMR E2E Integration Test              ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log(`\nBackend URL: ${BASE_URL}`);

  try {
    // Step 1: Health check
    await testHealth();

    // Step 2: Get signed URL
    const signedUrl = await requestSignedUrl("test_score.jpg");
    const assetId = signedUrl.asset_id;

    // Step 3: Upload file
    await uploadFile(assetId);

    // Step 4: Submit OMR job
    const omrJob = await submitOmrJob(assetId);
    const jobId = omrJob.job_id;

    // Step 5: Poll for completion
    const result = await pollOmrStatus(jobId);

    console.log(
      "\n╔══════════════════════════════════════════════════════════╗",
    );
    console.log(
      "║                    TEST PASSED ✅                         ║",
    );
    console.log("╚══════════════════════════════════════════════════════════╝");

    return { success: true, result };
  } catch (error) {
    console.error(
      "\n╔══════════════════════════════════════════════════════════╗",
    );
    console.error(
      "║                    TEST FAILED ❌                         ║",
    );
    console.error(
      "╚══════════════════════════════════════════════════════════╝",
    );
    console.error("\nError:", error.message);
    process.exit(1);
  }
}

runTest();

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image } = body; // Expecting a base64 encoded string

    if (!image) {
      return NextResponse.json(
        { error: "Image data is required in base64 format." },
        { status: 400 },
      );
    }

    // The URL of your deployed AWS Lambda function (e.g., Lambda Function URL or API Gateway)
    const lambdaUrl = process.env.ALGAE_DETECTOR_LAMBDA_URL;

    if (!lambdaUrl) {
      console.warn(
        "ALGAE_DETECTOR_LAMBDA_URL is not configured in environment variables.",
      );
      return NextResponse.json(
        { error: "AI processing service is not configured." },
        { status: 500 },
      );
    }

    // Forward the base64 image to the AWS Lambda Python backend
    const lambdaResponse = await fetch(lambdaUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image }),
    });

    if (!lambdaResponse.ok) {
      const errorText = await lambdaResponse.text();
      console.error("Lambda error response:", errorText);
      throw new Error(`Lambda returned status: ${lambdaResponse.status}`);
    }

    const result = await lambdaResponse.json();

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error processing algae detection API request:", error);
    return NextResponse.json(
      { error: "Failed to process the image through the AI model." },
      { status: 500 },
    );
  }
}
